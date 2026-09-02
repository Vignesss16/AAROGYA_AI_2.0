export function mapConsultationToFHIR(consultation: any, patientInfo?: any) {
  const fhirBundle = {
    resourceType: "Bundle",
    type: "document",
    entry: [
      {
        resource: {
          resourceType: "Composition",
          status: "final",
          type: {
            coding: [
              {
                system: "http://loinc.org",
                code: "11488-4",
                display: "Consultation note",
              },
            ],
          },
          subject: {
            reference: "urn:uuid:patient",
          },
          date: new Date(consultation.createdAt || Date.now()).toISOString(),
          author: [
            {
              display: `Dr. ${consultation.doctorName || "Unknown"}`,
            },
          ],
          title: "Teleconsultation Summary",
        },
      },
      {
        fullUrl: "urn:uuid:patient",
        resource: {
          resourceType: "Patient",
          name: [
            {
              text: consultation.patientName,
            },
          ],
          telecom: [
            {
              system: "phone",
              value: consultation.patientPhone,
            },
          ],
        },
      },
      {
        resource: {
          resourceType: "Encounter",
          status: "finished",
          class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "VR",
            display: "virtual",
          },
          subject: {
            reference: "urn:uuid:patient",
          },
          period: {
            start: new Date(consultation.createdAt || Date.now()).toISOString(),
          },
        },
      },
      {
        resource: {
          resourceType: "Condition",
          clinicalStatus: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
                code: "active",
              },
            ],
          },
          subject: {
            reference: "urn:uuid:patient",
          },
          code: {
            text: consultation.triageResult?.summary || consultation.symptoms?.join(", ") || "Unknown condition",
          },
        },
      },
    ],
  };

  // Attach prescription if available
  if (consultation.prescription) {
    try {
      const rxItems = JSON.parse(consultation.prescription);
      if (Array.isArray(rxItems)) {
        rxItems.forEach((rx: any) => {
          fhirBundle.entry.push({
            resource: {
              resourceType: "MedicationRequest",
              status: "active",
              intent: "order",
              subject: {
                reference: "urn:uuid:patient",
              },
              medicationCodeableConcept: {
                text: rx.medicine,
              },
              dosageInstruction: [
                {
                  text: `${rx.dose}, ${rx.frequency} for ${rx.duration}. ${rx.instructions}`,
                },
              ],
            },
          } as any);
        });
      }
    } catch {
      // Ignore if not JSON
    }
  }

  return fhirBundle;
}
