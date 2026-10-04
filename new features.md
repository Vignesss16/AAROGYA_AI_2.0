1>>>AAROGYA.AI — Diagnostic Lab Feature
1. What is this feature?

The Diagnostic Lab module allows a doctor to prescribe diagnostic tests for a patient and select a registered lab where those tests should be performed.

The complete process is handled inside AAROGYA.AI:

Doctor selects test → Doctor selects lab → Lab receives request → Lab accepts → Patient visits lab → Sample collected → Report uploaded → Doctor reviews report → Treatment / Referral / Follow-up

The main purpose is to keep the doctor, patient, lab, test and report connected to the same consultation/care episode.

2. Main users involved

There are 3 main users in this feature:

👨‍⚕️ Doctor
Selects diagnostic tests
Selects the lab
Sends lab request
Views test status
Receives and reviews report
Decides next step
🧑 Patient
Receives diagnostic request
Sees selected lab and test details
Receives appointment/instructions
Visits lab
Views final report
🧪 Lab Staff
Receives test request
Accepts/rejects request
Confirms appointment/slot
Records sample collection
Processes test
Uploads report
3. Complete flow
PATIENT
   │
   ↓
DOCTOR CONSULTATION
   │
   ↓
Doctor decides that a test is required
   │
   ↓
Doctor selects diagnostic test
   │
   ↓
Doctor selects registered lab
   │
   ↓
LAB REQUEST CREATED
   │
   ↓
Selected Lab receives request
   │
   ├──── Reject
   │
   └──── Accept
           │
           ↓
     Appointment / Slot
           │
           ↓
      Patient visits Lab
           │
           ↓
      Sample Collection
           │
           ↓
       Lab Processing
           │
           ↓
       Report Uploaded
           │
           ↓
       Doctor Notified
           │
           ↓
       Doctor Reviews
           │
       ┌───┼────┐
       ↓   ↓    ↓
 Treatment Referral Follow-up
4. Step 1 — Doctor selects the diagnostic test

After/during the consultation, the doctor decides that the patient needs a diagnostic test.

For example:

Patient: Rahul Sharma

Doctor selects:

CBC
Blood Sugar
HbA1c

The doctor clicks:

Prescribe Diagnostic Test
5. Step 2 — Doctor selects the lab

This is an important part of your feature.

The doctor selects the lab, not the patient.

The doctor can see labs registered on AAROGYA.AI.

For example:

Select Diagnostic Lab

○ ABC Diagnostics
  Location: Kalyan
  Services: CBC, Blood Sugar, HbA1c

○ CityCare Diagnostics
  Location: Dombivli
  Services: CBC, Blood Sugar

○ Government Diagnostic Centre
  Location: Kalyan
  Services: CBC, HbA1c

The doctor chooses:

ABC Diagnostics

Then:

Send Lab Request
6. What information is sent to the lab?

The backend creates a Lab Order.

The lab should receive the information necessary to perform the requested test, such as:

Patient:
Rahul Sharma

Doctor:
Dr. XYZ

Tests:
- CBC
- Blood Sugar
- HbA1c

Consultation ID:
C456

Lab Order ID:
LAB001

Priority:
Normal / Urgent

Instructions:
Doctor's instructions if applicable

Don't send the patient's entire medical history to the lab automatically.

Only the information needed for the diagnostic service should be shared, with appropriate access controls and consent where required. ABDM's approach emphasizes privacy, security and consent-based health-data sharing. 

7. Backend — Lab Order creation

When the doctor clicks Send Lab Request, the frontend sends a request to your backend.

Doctor Dashboard
       ↓
Backend API
       ↓
Create Lab Order
       ↓
MongoDB
       ↓
Notify Selected Lab

Example database record:

labOrderId: LAB001

patientId: P123
doctorId: D789
consultationId: C456
labId: LAB007

tests:
  - CBC
  - Blood Sugar
  - HbA1c

status:
  SENT_TO_LAB

createdAt:
  timestamp
8. Step 3 — Lab receives the request

The selected lab gets a notification:

New Diagnostic Request
Patient: Rahul Sharma

Requested By:
Dr. XYZ

Tests:
✓ CBC
✓ Blood Sugar
✓ HbA1c

Priority:
Normal

[ ACCEPT ]   [ REJECT ]
9. Step 4 — Lab accepts the request

If the lab accepts:

SENT_TO_LAB
      ↓
LAB_ACCEPTED

The patient receives a notification:

Your doctor has sent a diagnostic test request to ABC Diagnostics.

The patient can now see:

Lab name
Lab location
Tests
Appointment/slot information
Instructions
Current status
10. Step 5 — Appointment / Slot

You have two ways to implement this.

Recommended for your MVP:

The lab provides available slots after accepting the request.

For example:

ABC Diagnostics

Available Slots:

10:00 AM
11:30 AM
2:00 PM
4:30 PM

The patient can select a convenient slot.

Notice the difference:

Doctor chooses the lab. Patient can choose a convenient time at that lab.

This gives both sides control.

11. Step 6 — Patient visits the lab

Once the appointment is confirmed:

LAB_ACCEPTED
      ↓
APPOINTMENT_CONFIRMED
      ↓
PATIENT_VISITS
      ↓
SAMPLE_COLLECTED

The lab staff marks:

Sample Collected
12. Step 7 — Lab processes the test

The status can move like:

SAMPLE_COLLECTED
        ↓
PROCESSING
        ↓
REPORT_READY

The patient can see something like:

Your test is currently being processed.

13. Step 8 — Lab uploads the report

Once testing is complete, the lab staff uploads the report.

For example:

CBC_Report.pdf

The actual PDF/image should preferably be stored in secure file/object storage, while MongoDB stores the report metadata and file reference.

Example:

reportId: REP001

labOrderId: LAB001

patientId: P123

doctorId: D789

labId: LAB007

fileUrl: secure-storage-url

status: REPORT_UPLOADED

uploadedAt: timestamp
14. Step 9 — Doctor gets notified

As soon as the report is uploaded:

Lab
 ↓
Backend
 ↓
Notification Service
 ↓
Doctor Dashboard

Doctor sees:

🔔 New Lab Report

Rahul Sharma's CBC report is ready for review.

15. Step 10 — Doctor reviews the report

Doctor opens:

Patient
   ↓
Consultation
   ↓
Diagnostic Tests
   ↓
Lab Report

The doctor can see:

Patient

Rahul Sharma

Tests

CBC
Blood Sugar
HbA1c

Report

View Report

Doctor's Action
Continue treatment
Change treatment
Order another test
Create referral
Schedule follow-up
16. How it connects with Referral

This is where your features become powerful.

Suppose the doctor sees something abnormal.

The flow becomes:

Lab Report
    ↓
Doctor Review
    ↓
Abnormal Result
    ↓
Referral Required
    ↓
Create Referral
    ↓
Specialist / Hospital

So the referral isn't disconnected from the lab.

The doctor can attach the relevant report to the referral.

For example:

Referral
 ├── Patient details
 ├── Consultation notes
 ├── Lab report
 ├── Prescription
 └── Reason for referral
17. How it connects with Appointment Booking

Suppose the doctor wants the patient to come back after the test.

The flow can be:

Doctor
  ↓
Prescribes Lab Test
  ↓
Lab Report
  ↓
Doctor Reviews
  ↓
Follow-up Required
  ↓
Appointment Booking
  ↓
Patient returns to Doctor

So your diagnostic feature naturally connects with the appointment module.

18. How it connects with the Patient's Clinical Record

Every lab order should be connected to:

patientId
+
consultationId
+
doctorId

So you get:

PATIENT
  │
  ↓
CONSULTATION
  │
  ├── Prescription
  │
  ├── Lab Order
  │      │
  │      ↓
  │   Lab Report
  │
  ├── Referral
  │
  └── Follow-up

This is very important.

You don't want a lab report sitting separately in the database with no connection to the consultation that caused it.

19. Suggested MongoDB collections

For this feature, you can have:

labs
labOrders
labReports
labs

Stores registered lab information:

labId
name
address
location
contact
services
workingHours
status

Example:

LAB007
ABC Diagnostics
Kalyan
CBC
Blood Sugar
HbA1c
labOrders

Stores the doctor's request:

labOrderId
patientId
doctorId
consultationId
labId

tests[]

priority

status

createdAt
updatedAt
labReports

Stores the result:

reportId
labOrderId
patientId
doctorId
labId

reportUrl
reportType

status

uploadedAt
reviewedAt
doctorNotes
20. Lab status system

Keep a proper status system instead of just pending and completed.

I recommend:

CREATED
   ↓
SENT_TO_LAB
   ↓
LAB_ACCEPTED
   ↓
APPOINTMENT_CONFIRMED
   ↓
SAMPLE_COLLECTED
   ↓
PROCESSING
   ↓
REPORT_READY
   ↓
REPORT_UPLOADED
   ↓
DOCTOR_REVIEWED
   ↓
COMPLETED

If something goes wrong:

REJECTED
CANCELLED

This makes tracking much easier.

21. Notifications

You need notifications at important points.

Doctor
Lab accepted request
Lab rejected request
Report uploaded
Patient
Lab request created
Lab accepted
Appointment confirmed
Sample collected
Report ready
Lab
New test request
Appointment booked/cancelled

You can have one common:

Notification Service
Backend
   ↓
Notification Service
   ├── In-app
   ├── Push
   ├── SMS
   └── Email

You don't need to build four separate notification systems.

22. Who can see what?

This is extremely important because this is medical information.

👨‍⚕️ Doctor

Can see:

Patient
Tests
Lab status
Lab report
Previous relevant consultation information
Doctor notes
🧪 Lab

Can see:

Patient information required for testing
Test request
Doctor/request details needed for the service
Appointment
Sample information
🧑 Patient

Can see:

Selected lab
Tests prescribed
Appointment
Test status
Final report
👨‍💼 Admin

Can manage:

Registered labs
Lab verification
Lab status
Requests
System issues
Audit logs

Use role-based access control so users cannot simply access another patient's reports by changing an ID in a URL/API request.

23. What happens if the lab rejects?

For example:

ABC Diagnostics cannot perform HbA1c today.

Lab clicks:

Reject

and provides a reason.

Backend:

LAB_ACCEPTED
        ↓
REJECTED

Doctor gets:

ABC Diagnostics rejected the diagnostic request.

Then the doctor can select another registered lab.

Doctor
  ↓
Select Another Lab
  ↓
Send New Request

I would keep the doctor in control of changing the lab.

24. What happens if the patient doesn't go?

You can track:

APPOINTMENT_CONFIRMED
        ↓
PATIENT VISITED

If the patient doesn't show:

NO_SHOW

The lab can mark:

No Show

Then the patient/doctor can be notified.

25. What happens if the report is corrected?

Don't simply overwrite the old report.

For medical records, it is better to maintain a basic version/audit trail:

Report v1
   ↓
Correction
   ↓
Report v2

The system should record:

Who uploaded it
When it was uploaded
Who changed it
When it was changed

This becomes important as your system grows.

26. Full technical data flow

This is the part your developer friend will probably find most useful:

┌─────────────────┐
│ DOCTOR DASHBOARD│
└────────┬────────┘
         │
         │ Select Test + Lab
         ↓
┌─────────────────┐
│  BACKEND API    │
└────────┬────────┘
         │
         ├──────────────→ MongoDB
         │                  │
         │                  ↓
         │             Lab Order
         │
         ↓
┌─────────────────┐
│ NOTIFICATION    │
│    SERVICE      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   LAB DASHBOARD │
└────────┬────────┘
         │
         │ Accept
         ↓
┌─────────────────┐
│ APPOINTMENT /   │
│ SAMPLE PROCESS  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  REPORT UPLOAD  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ FILE STORAGE    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   MONGODB       │
│ Report Metadata │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ DOCTOR DASHBOARD│
└────────┬────────┘
         │
         ↓
  Doctor Reviews
         │
    ┌────┼─────┐
    ↓    ↓     ↓
Treatment Referral Follow-up
27. The simplest explanation you can send your friend

You can literally send him this:

Diagnostic Lab Feature — AAROGYA.AI

Doctor prescribes a diagnostic test during a consultation and selects the registered lab himself. The request goes from the doctor dashboard → backend → selected lab dashboard. The lab can accept/reject the request. Once accepted, the lab provides/assigns an appointment slot. The patient gets the lab details and visits the selected lab for sample collection. The lab updates the test status and uploads the final report through its dashboard. The report is stored securely, while its metadata is linked with the patient, doctor, lab order and consultation. The doctor gets a notification when the report is uploaded and can open the report from the patient's consultation. Based on the result, the doctor can continue treatment, prescribe another test, create a referral or schedule a follow-up.

Main flow:
Doctor → Select Test → Select Lab → Lab Request → Lab Accepts → Appointment → Sample Collection → Processing → Report Upload → Doctor Review → Treatment / Referral / Follow-up

Main database relationships:
Patient → Consultation → Lab Order → Lab → Lab Report

Important: The doctor chooses the lab. The patient does not choose the lab. The patient only receives the selected lab details and completes the test.

One architecture decision I strongly recommend

Make consultationId the link between this lab feature and the rest of AAROGYA.AI.

So:

consultationId: C456
       │
       ├── prescription
       ├── labOrder
       ├── labReport
       ├── referral
       └── followUp

That way, when a doctor opens one consultation, they can see the complete story of that case rather than searching through separate modules.



















-------------------------------------------------------------------



















2>>>>> AAROGYA.AI — Doctor Review Feature
1. What is this feature?

The Doctor Review feature allows a patient to give feedback and a rating to the doctor after a consultation is completed.

The patient can rate the doctor and optionally write a review.

The purpose is to:

Measure patient satisfaction
Help improve doctor service
Give admins feedback about consultations
Maintain a history of patient reviews

The review should be linked to the specific consultation, so one patient cannot randomly review a doctor without actually having a completed consultation.

2. Main users
🧑 Patient
Gives rating after consultation
Writes optional feedback
Can view their submitted review
👨‍⚕️ Doctor
Can view ratings/reviews received
Can see overall rating
Should not be able to edit or delete patient reviews
👨‍💼 Admin
Can monitor reviews
Can identify complaints/issues
Can manage inappropriate/spam reviews
3. Basic flow
Patient
   ↓
Appointment
   ↓
Doctor Consultation
   ↓
Consultation Completed
   ↓
"Rate Your Doctor"
   ↓
⭐ Rating
   ↓
Optional Review
   ↓
Submit
   ↓
Review Saved
   ↓
Doctor Dashboard
4. When should the review appear?

The review should not appear immediately when the appointment is booked.

It should become available only after:

Appointment
      ↓
Consultation Started
      ↓
Consultation Completed
      ↓
Review Available

For example:

How was your consultation with Dr. Sharma?

⭐⭐⭐⭐⭐

Rating: 5/5

Write a review (optional)

[ Submit Review ]

5. Rating system

Use a simple 1–5 star rating.

⭐ 1 — Very Poor
⭐⭐ 2 — Poor
⭐⭐⭐ 3 — Average
⭐⭐⭐⭐ 4 — Good
⭐⭐⭐⭐⭐ 5 — Excellent

For the MVP, this is enough.

You don't need a complicated rating system initially.

6. Optional written review

After selecting stars, the patient can write something like:

"The doctor explained my problem clearly and answered all my questions."

Or:

"The consultation was helpful but there was a delay in connecting."

The review should be optional.

So the patient can submit:

⭐⭐⭐⭐⭐
No written feedback

or:

⭐⭐⭐⭐⭐
"Very helpful consultation."
7. Important rule — one consultation = one review

This is important from the backend side.

A patient should not be able to submit 10 reviews for the same consultation.

Use:

consultationId + patientId

as the basis for checking whether a review already exists.

Example:

Consultation C123
        ↓
Review exists?
    ┌───┴───┐
   YES      NO
    ↓        ↓
Don't      Allow
allow      review
8. Review should be connected to the consultation

Don't simply store:

patientId
doctorId
rating
review

Also store:

consultationId

So you know exactly which consultation generated the review.

Recommended relationship:

Patient
   ↓
Appointment
   ↓
Consultation
   ↓
Review
9. Example database structure

Create a reviews collection.

Example:

reviewId: REV001

patientId: P123

doctorId: D456

consultationId: C789

appointmentId: A321

rating: 5

comment:
"Doctor explained everything clearly."

status:
PUBLISHED

createdAt:
timestamp

You can also store:

updatedAt

if you later allow edits.

10. Patient dashboard

After consultation:

Consultation Completed
Dr. Rahul Sharma
General Physician

Consultation completed

How was your consultation?

⭐ ⭐ ⭐ ⭐ ⭐

Your feedback
[________________________]

[ Submit Review ]

After submission:

Thank you for your feedback!

11. Doctor dashboard

Doctor should have a section like:

Patient Reviews
Overall Rating

⭐ 4.7 / 5

Based on 128 reviews

Then:

⭐⭐⭐⭐⭐
"Very helpful doctor."

⭐⭐⭐⭐
"Good consultation."

⭐⭐⭐⭐⭐
"Doctor explained the treatment properly."

You can also show:

5 ⭐  82%
4 ⭐  12%
3 ⭐   4%
2 ⭐   1%
1 ⭐   1%

This is optional for the MVP.

12. Admin dashboard

Admin can see:

Doctor Reviews

Doctor        Rating      Reviews
----------------------------------
Dr. Sharma     4.7          128
Dr. Patel      4.5           94
Dr. Khan       4.8          156

Admin can also identify:

Very low ratings
Repeated complaints
Potential spam
Serious patient feedback
13. Review moderation

You should have a basic moderation system.

For example, if someone submits:

"This doctor is useless and [abusive content]"

Admin can flag/remove it according to your platform's review policy.

Database:

status:
PUBLISHED
FLAGGED
HIDDEN

But don't allow the doctor to simply delete a negative review.

That would make the rating system unreliable.

14. Notification flow

After consultation:

Consultation Completed
        ↓
Backend
        ↓
Notification Service
        ↓
Patient

Patient receives:

Your consultation with Dr. Sharma is complete. Please rate your experience.

You can provide:

In-app notification
Push notification
SMS, if required

For MVP, in-app/push notification is enough.

15. API flow

Your developer friend can implement APIs roughly like:

POST /reviews
GET  /doctors/:doctorId/reviews
GET  /doctors/:doctorId/rating
GET  /patients/:patientId/reviews
Create Review
POST /reviews

Request:

{
  "patientId": "P123",
  "doctorId": "D456",
  "consultationId": "C789",
  "rating": 5,
  "comment": "Very helpful consultation."
}

Backend should verify:

Patient exists
Doctor exists
Consultation exists
Patient actually belongs to that consultation
Doctor belongs to that consultation
Consultation is completed
Review doesn't already exist

Then save it.

16. Average rating calculation

Suppose the doctor has:

5 stars → 80 reviews
4 stars → 30 reviews
3 stars → 10 reviews
2 stars → 5 reviews
1 star  → 3 reviews

Backend calculates:

Average Rating =
Σ(all ratings) / Total Reviews

You can either calculate this dynamically or maintain an aggregated value in the doctor profile.

For example:

doctor:

averageRating: 4.6
totalReviews: 128
17. Security / access control

This is important.

Patient can:

✅ Create their own review
✅ View their own review

Patient cannot:

❌ Create a review for another patient's consultation
❌ Review a doctor they never consulted
❌ Submit multiple reviews for the same consultation

Doctor can:

✅ View reviews about themselves

Doctor cannot:

❌ Modify patient ratings
❌ Change a patient's review

Admin can:

✅ Moderate reviews
✅ View platform-wide review data

This should be enforced on the backend, not only by hiding buttons in the frontend.

18. AI — optional future feature

You don't need AI for the basic review system.

But later you can add:

AI Review Analysis

For example:

100 reviews
     ↓
AI Analysis
     ↓
Common feedback

Output:

Positive:
✓ Doctor communication
✓ Explanation quality
✓ Polite behaviour

Issues:
⚠ Waiting time
⚠ Appointment delays

This can help the admin understand common problems.

But don't let AI automatically punish or downgrade doctors based on a single review.

19. How it connects with the rest of AAROGYA.AI

Your overall system can become:

Patient
   ↓
Appointment
   ↓
Doctor Consultation
   │
   ├──── Prescription
   │
   ├──── Diagnostic Lab
   │          ↓
   │       Lab Report
   │          ↓
   │       Doctor Review
   │
   ├──── Referral
   │
   └──── Follow-up
          │
          ↓
     Consultation Completed
          │
          ↓
     Patient Review

This is why the consultationId is important.

Everything related to one healthcare interaction should remain connected.

20. Recommended database structure

Your friend can add:

reviews

with:

reviewId
patientId
doctorId
consultationId
appointmentId
rating
comment
status
createdAt
updatedAt

And optionally:

moderationReason
flaggedAt
21. Simple version to send your friend

You can send him this directly:

Doctor Review Feature — AAROGYA.AI

After a patient's consultation is completed, the patient gets an option to rate the doctor from 1–5 stars and optionally write feedback. The review must be linked to the specific consultationId, patientId, and doctorId, so only a patient who actually completed a consultation can review that doctor. One consultation should allow only one review.

Flow:
Appointment → Consultation → Consultation Completed → Patient Gets Review Option → Star Rating + Optional Comment → Submit → Review Saved → Doctor/Admin Dashboard

Doctor can see their average rating and patient reviews. Admin can monitor and moderate inappropriate/spam reviews. Patients cannot review consultations they did not attend, submit duplicate reviews, or modify another patient's review.

Main collection: reviews

Fields: reviewId, patientId, doctorId, consultationId, appointmentId, rating, comment, status, createdAt, updatedAt

Future: AI can analyze reviews to identify common positive feedback and recurring issues, but AI should only provide insights and should not automatically take disciplinary actions.








-------------------------------------------------------------------



>>>>>>>>>AAROGYA.AI — Referral Tracking Feature
1. What is this feature?

The Referral Tracking module allows a doctor or hospital to refer a patient to another hospital, specialist, or healthcare facility and track the referral from creation → acceptance → patient visit → treatment/outcome.

For example:

A patient visits Hospital A → Doctor finds that specialist care is required → Doctor refers patient to Hospital B → Hospital B receives the referral → Hospital B accepts it → Patient visits Hospital B → Hospital B updates the referral outcome.

The important part is:

The receiving hospital knows exactly who referred the patient, why the patient was referred, and what clinical information was attached to the referral.

This fits well with interoperable digital health systems, where health information can be exchanged between different healthcare providers subject to appropriate privacy and consent controls.

2. Main users

There are mainly 4 users involved.

👨‍⚕️ Referring Doctor

Can:

Create referral
Select receiving hospital/facility
Select specialist/department
Add referral reason
Attach relevant reports
Track referral status
See referral outcome
🏥 Referring Hospital

Can:

Create/manage referrals
Track patients referred from their facility
View referral history
🏥 Receiving Hospital

Can:

Receive referral
View referral details
Accept/reject referral
Assign doctor/department
Schedule patient
Update patient visit
Add outcome
🧑 Patient

Can:

See referral details
See referred hospital
See referral status
Receive notifications
See appointment/instructions
See outcome when appropriate
3. Basic flow
Patient
   ↓
Consultation
   ↓
Doctor decides referral is required
   ↓
Doctor selects receiving hospital
   ↓
Referral Created
   ↓
Receiving Hospital gets notification
   ↓
Hospital Accepts / Rejects
   ↓
Appointment / Visit
   ↓
Patient reaches receiving hospital
   ↓
Treatment / Investigation
   ↓
Referral Outcome Updated
   ↓
Referring Doctor can see outcome
4. Example

Let's take a real example.

Hospital A

Patient:

Rahul Sharma

Doctor:

Dr. Amit

During consultation, the doctor discovers that Rahul requires cardiology evaluation.

Doctor decides:

Refer patient to a cardiologist.

Doctor opens:

Create Referral
5. Step 1 — Doctor creates referral

The doctor sees:

Create Referral

Patient:
Rahul Sharma

Reason for Referral:
Cardiology evaluation

Department:
Cardiology

Priority:
Normal / Urgent

Receiving Hospital:
[ Select Hospital ]

Specialist:
[ Optional ]

Notes:
Patient requires specialist evaluation.
6. Step 2 — Doctor selects receiving hospital

The doctor selects a registered healthcare facility.

For example:

Receiving Hospital

CityCare Hospital
Kalyan

Department:
Cardiology

Available:
✓ Cardiology
✓ General Medicine
✓ Emergency

Again, the important thing is:

The referring doctor/hospital selects where the patient is being referred.

The patient doesn't randomly choose a hospital after the referral has been created.

7. Step 3 — Attach relevant medical information

The doctor can attach information relevant to the referral.

For example:

Referral Attachments

✓ Consultation Notes
✓ ECG Report
✓ Blood Test Report
✓ Previous Prescription

Don't automatically send the patient's entire medical history.

Only relevant information should be shared, with appropriate access controls and consent. ABDM explicitly emphasizes privacy/security by design, consent-based processing, and access to health information on a need-to-know basis.

8. Step 4 — Referral is created

Backend creates a referral record.

Example:

referralId:
REF001

patientId:
P123

referringDoctorId:
D456

referringFacilityId:
HOSP001

receivingFacilityId:
HOSP007

consultationId:
C789

department:
Cardiology

reason:
Specialist evaluation

priority:
NORMAL

status:
SENT
9. Step 5 — Receiving hospital gets the referral

Hospital B gets:

🔔 New Referral
New Patient Referral

Patient:
Rahul Sharma

Referred By:
Dr. Amit
Hospital A

Department:
Cardiology

Reason:
Specialist evaluation

Priority:
Normal

Attachments:
3

[ ACCEPT ] [ REJECT ]
10. Step 6 — Receiving hospital accepts

If Hospital B accepts:

SENT
 ↓
ACCEPTED

The referring doctor receives:

CityCare Hospital accepted Rahul Sharma's referral.

The patient can also receive:

Your referral has been accepted by CityCare Hospital.

11. What if the hospital rejects it?

For example:

Cardiology department currently unavailable.

Hospital B clicks:

Reject Referral

It should provide a reason:

Reason:
Specialist unavailable

Suggested action:
Refer to another facility

Status:

SENT
 ↓
REJECTED

The referring doctor gets notified.

Then the doctor can select another facility.

12. Step 7 — Appointment / visit

Once accepted, the receiving hospital can schedule the patient.

Example:

Referral Accepted

Hospital:
CityCare Hospital

Department:
Cardiology

Doctor:
Dr. XYZ

Appointment:
18 October
11:30 AM

Patient receives:

Your referral appointment has been scheduled.

13. Step 8 — Patient visits receiving hospital

When the patient arrives, the receiving hospital marks:

PATIENT_VISITED

Flow:

ACCEPTED
   ↓
APPOINTMENT_SCHEDULED
   ↓
PATIENT_VISITED
14. Step 9 — Treatment / investigation

The receiving doctor can now:

Examine patient
Review referral information
Review attached reports
Order diagnostic tests
Prescribe treatment
Admit patient if necessary
Refer further if required
15. Step 10 — Referral outcome

After treatment, the receiving hospital updates the referral.

For example:

Referral Outcome

Patient evaluated by:
Dr. XYZ

Department:
Cardiology

Outcome:
Patient evaluated and treatment started.

Follow-up:
After 2 weeks

Status:

PATIENT_VISITED
       ↓
TREATMENT_COMPLETED
       ↓
OUTCOME_UPDATED
       ↓
CLOSED
16. Why the outcome is important

This is where your feature becomes Referral Tracking, rather than simply a referral form.

Without tracking:

Doctor → Referral → ❓

Nobody knows what happened.

With your system:

Doctor
  ↓
Referral Created
  ↓
Hospital Accepted
  ↓
Appointment
  ↓
Patient Visited
  ↓
Treatment
  ↓
Outcome
  ↓
Referring Doctor

The entire journey is visible.

17. Referral status system

I recommend using clear statuses:

DRAFT
   ↓
SENT
   ↓
ACCEPTED
   ↓
APPOINTMENT_SCHEDULED
   ↓
PATIENT_VISITED
   ↓
UNDER_TREATMENT
   ↓
OUTCOME_UPDATED
   ↓
CLOSED

Alternative states:

REJECTED
CANCELLED
EXPIRED
NO_SHOW
18. Referral priority

You can have:

Normal

Routine specialist referral.

Urgent

Patient should be evaluated soon.

Emergency

Requires immediate escalation according to your clinical workflow.

For an MVP, you can simply have:

Normal
Urgent

and add emergency workflows later.

19. Referral database structure

Create a MongoDB collection:

referrals

Example:

{
  "referralId": "REF001",
  "patientId": "P123",
  "consultationId": "C789",
  "referringDoctorId": "D456",
  "referringFacilityId": "HOSP001",
  "receivingFacilityId": "HOSP007",
  "receivingDoctorId": null,
  "department": "Cardiology",
  "reason": "Specialist evaluation",
  "priority": "NORMAL",
  "status": "SENT",
  "attachments": [],
  "notes": "Requires cardiology evaluation",
  "createdAt": "...",
  "updatedAt": "..."
}
20. Referral attachments

You can attach:

Consultation Notes
Prescription
Lab Reports
Diagnostic Reports
Imaging Reports
Doctor Notes

But don't duplicate the actual files unnecessarily.

For example:

Referral
   ↓
Lab Report ID
   ↓
Existing Lab Report

Instead of uploading the same report again.

This is another reason why your modules should be connected through IDs.

21. Connection with your Diagnostic Lab feature

This is where your overall system starts becoming strong.

Example:

Consultation
     ↓
Diagnostic Test
     ↓
Lab Report
     ↓
Doctor Reviews
     ↓
Referral Required
     ↓
Referral Created
     ↓
Specialist Hospital

The referral can reference the existing:

labOrderId
labReportId
consultationId

So the receiving doctor can access the relevant report according to permissions.

22. Connection with Appointment Booking

Your existing appointment system can also connect here.

Referral
   ↓
Hospital Accepts
   ↓
Hospital/Receptionist
   ↓
Creates Available Slot
   ↓
Patient Appointment

So you don't need to build a completely separate appointment system for referrals.

Reuse your existing appointment module.

23. Patient dashboard

The patient can have:

My Referrals
Referral #REF001

Referred By:
Hospital A

Referred To:
CityCare Hospital

Department:
Cardiology

Reason:
Specialist evaluation

Status:
✓ Accepted

Appointment:
18 Oct, 11:30 AM

After the visit:

Status:
✓ Completed

Outcome:
Specialist consultation completed.

Follow-up:
Required
24. Referring doctor's dashboard

Doctor can have:

My Referrals
Patient       Hospital       Status
-----------------------------------------
Rahul         CityCare       Accepted
Priya         MetroCare      Appointment
Amit          General Hosp   Completed
Neha          CityCare       Rejected

Clicking a referral opens:

Patient
   ↓
Reason
   ↓
Attachments
   ↓
Receiving Hospital
   ↓
Status Timeline
   ↓
Outcome
25. Receiving hospital dashboard

The receiving hospital can have:

Incoming Referrals
Patient        Referred By       Priority
-------------------------------------------
Rahul          Hospital A        Normal
Priya          Dr. Sharma        Urgent
Amit           Hospital C        Normal

Each referral has:

[ View ]

Patient
Reason
Doctor
Reports
Priority

[ Accept ]
[ Reject ]
26. Referral timeline

This would be a very good UI feature.

Show the complete referral journey:

✓ Referral Created
18 Oct — 09:10 AM

        ↓

✓ Referral Accepted
18 Oct — 10:05 AM

        ↓

✓ Appointment Scheduled
18 Oct — 11:00 AM

        ↓

✓ Patient Visited
19 Oct — 02:15 PM

        ↓

✓ Specialist Consultation
19 Oct — 02:30 PM

        ↓

✓ Outcome Updated
19 Oct — 03:10 PM

This makes the feature very easy to understand.

27. Notifications
Referring Doctor
Referral accepted
Referral rejected
Appointment scheduled
Patient visited
Outcome updated
Patient
Referral created
Referral accepted
Appointment scheduled
Appointment reminder
Referral completed
Receiving Hospital
New referral
Referral cancelled
Patient appointment
28. Security / access control

This is extremely important because referrals contain medical information.

Referring doctor

Can:

✅ Create referral
✅ View referral
✅ Track status
✅ View outcome

Receiving doctor/hospital

Can:

✅ View referral assigned to them
✅ View permitted clinical information
✅ Update treatment/outcome

Patient

Can:

✅ View their own referral
✅ View status
✅ View appointment details

Admin

Can:

✅ Monitor referrals
✅ Manage facilities
✅ Handle disputes/issues
✅ View system-level analytics

Nobody should be able to access another patient's referral just by knowing their referralId.

29. API structure

Your friend can implement APIs roughly like:

POST   /referrals
GET    /referrals/:referralId
PATCH  /referrals/:referralId/status
POST   /referrals/:referralId/accept
POST   /referrals/:referralId/reject
POST   /referrals/:referralId/appointment
POST   /referrals/:referralId/outcome
GET    /patients/:patientId/referrals
GET    /doctors/:doctorId/referrals
GET    /facilities/:facilityId/referrals

For MVP, you don't necessarily need every endpoint as a separate route; you can structure them according to your existing backend architecture.

30. Full technical flow
┌─────────────────────┐
│ REFERRING DOCTOR    │
└──────────┬──────────┘
           │
           │ Create Referral
           ↓
┌─────────────────────┐
│     BACKEND API     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│      MONGODB        │
│     referrals       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ NOTIFICATION SERVICE │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ RECEIVING HOSPITAL  │
└──────────┬──────────┘
           │
       Accept/Reject
           │
           ↓
     Appointment
           │
           ↓
     Patient Visit
           │
           ↓
      Treatment
           │
           ↓
    Referral Outcome
           │
           ↓
┌─────────────────────┐
│ REFERRING DOCTOR    │
│  sees outcome       │
└─────────────────────┘
31. Connection with your overall AAROGYA.AI architecture

This is the important part.

Your Care Episode / Clinical Case can become the parent of everything:

                 CARE EPISODE
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
  Consultation   Lab Diagnostic   Referral
       │              │              │
       ↓              ↓              ↓
 Prescription      Report        Outcome
       │                             │
       └──────────────┬──────────────┘
                      ↓
                  Follow-up

And everything is linked using IDs:

patientId
consultationId
labOrderId
labReportId
referralId
appointmentId

That gives you a connected healthcare workflow instead of separate features.

32. Simple version to send your friend

You can directly send this:

Referral Tracking Feature — AAROGYA.AI

This feature allows a doctor/hospital to refer a patient to another registered hospital or specialist and track the complete referral journey. The referring doctor creates the referral, selects the receiving hospital/department, adds the reason and attaches relevant reports/consultation information. The receiving hospital gets the referral and can accept or reject it. If accepted, an appointment can be scheduled. When the patient visits, the receiving hospital updates the status and after treatment adds the referral outcome. The referring doctor can then see what happened to the patient after referral.

Flow:
Doctor Consultation → Create Referral → Select Hospital → Attach Relevant Reports → Send Referral → Receiving Hospital Accepts/Rejects → Appointment → Patient Visit → Treatment → Outcome → Referral Closed

Main collection: referrals

Important fields: referralId, patientId, consultationId, referringDoctorId, referringFacilityId, receivingFacilityId, receivingDoctorId, department, reason, priority, attachments, status, outcome, createdAt, updatedAt

Main statuses:
DRAFT → SENT → ACCEPTED → APPOINTMENT_SCHEDULED → PATIENT_VISITED → UNDER_TREATMENT → OUTCOME_UPDATED → CLOSED





------------------------------------------------------------------




















6>>>>FEATURE 4 — APPOINTMENT BOOKING

Your notebook describes a very specific architecture:

Doctor tells receptionist available times → receptionist enters slots → patient sees those slots → patient selects one → request goes to receptionist → receptionist verifies patient → appointment gets approved → doctor and patient receive notifications.

I would implement it exactly this way.

Step 1 — Doctor gives availability

Doctor dashboard:

Dr. Sharma

Monday

10:00 – 10:30
10:30 – 11:00
11:00 – 11:30

Tuesday

09:00 – 09:30
09:30 – 10:00

Doctor can also tell receptionist manually, and receptionist enters the slots.

Step 2 — Receptionist creates slots

Receptionist dashboard:

Doctor: Dr. Sharma

Date: 10 Oct

10:00 AM  AVAILABLE
10:30 AM  AVAILABLE
11:00 AM  AVAILABLE

Database:

appointmentSlots

slotId
doctorId
date
startTime
endTime
status

Example:

SLOT001
doctorId: D789
date: 2026-10-10
start: 10:00
end: 10:30
status: AVAILABLE
Step 3 — Patient sees slots

Patient opens:

Book Doctor Appointment

Backend checks:

Doctor
+
Date
+
Available slots

Patient sees only:

10:00 AM   AVAILABLE
10:30 AM   AVAILABLE
11:00 AM   AVAILABLE
Step 4 — Patient clicks Book

Patient selects:

10:30 AM

Don't immediately mark it permanently booked if your workflow requires receptionist verification.

Create:

appointmentId: A001

patientId: P123
doctorId: D789
slotId: SLOT002

status:
PENDING_RECEPTIONIST_CONFIRMATION
Step 5 — Receptionist receives request

Receptionist dashboard:

New Appointment Request

Patient: Rahul
Doctor: Dr. Sharma
Date: 10 Oct
Time: 10:30 AM

[VIEW PATIENT]
[APPROVE]
[REJECT]
Step 6 — Receptionist verifies patient

This matches what you wrote in your notebook.

Receptionist can call the patient.

For example:

"Are you actually requesting this appointment?"

If genuine:

APPROVE

If not:

REJECT

Step 7 — Appointment confirmed

Backend updates:

appointment.status =
CONFIRMED

slot.status =
BOOKED

This must happen in a transaction / atomic operation so two patients cannot successfully book the same slot at the same time.

Step 8 — Notifications

After confirmation:

Backend
   ├──→ Patient notification
   └──→ Doctor notification

Patient:

Appointment confirmed with Dr. Sharma on 10 Oct at 10:30 AM.

Doctor:

New appointment confirmed — Rahul, 10 Oct, 10:30 AM.

7. NOW CONNECT ALL FOUR FEATURES

This is the most important part.

Don't think of them as:

Lab
Review
Referral
Appointment

Think of them as one continuous journey:

                     PATIENT
                        │
                        ↓
                 BOOK APPOINTMENT
                        │
                        ↓
                  DOCTOR CONSULT
                        │
             ┌──────────┼──────────┐
             ↓          ↓          ↓
          REVIEW       LAB      REFERRAL
                       │          │
                       ↓          ↓
                  LAB REPORT   HOSPITAL
                       │          │
                       └────┬─────┘
                            ↓
                     DOCTOR REVIEWS
                            │
                            ↓
                       TREATMENT
                            │
                            ↓
                        FOLLOW-UP

That is your actual AAROGYA.AI care flow.

8. THE DATABASE CONNECTION

Here's how everything should connect.

PATIENT
   │
   ├──────── APPOINTMENT
   │               │
   │               └── DOCTOR
   │
   └──────── CONSULTATION
                   │
        ┌──────────┼───────────┐
        │          │           │
        ↓          ↓           ↓
   PRESCRIPTION   LAB       REFERRAL
                   │           │
                   ↓           ↓
              LAB REPORT   OTHER HOSPITAL
                   │
                   └──────┬────┘
                          ↓
                    FOLLOW-UP
                          │
                          ↓
                       REVIEW
9. Your MongoDB collections

I would start with these:

users
patients
doctors
receptionists
facilities

appointments
appointmentSlots

consultations
prescriptions

labOrders
labReports
labs

referrals

reviews

notifications

Later you can add:

medicalRecords
medications
followUps
auditLogs
abhaProfiles
10. VERY IMPORTANT — DON'T DUPLICATE PATIENT DATA

Suppose Rahul has:

Age: 45
Allergy: Penicillin

Don't copy this information separately into:

appointment
lab
referral
prescription
review

Instead:

Patient
P123
   │
   ├── Appointment
   ├── Consultation
   ├── Lab
   ├── Referral
   └── Prescription

Everything references:

patientId = P123

Then you have one source of truth.

This becomes especially important if you later implement your Clinical Context concept.

11. The notification architecture

All four features need notifications.

Instead of every feature creating its own notification system, make one common service:

Feature
   ↓
Backend
   ↓
Notification Service
   ├── In-app notification
   ├── SMS
   ├── Email
   └── Push notification

For example:

Appointment
Appointment confirmed
        ↓
Notification Service
        ↓
Patient + Doctor
Lab
Report uploaded
        ↓
Notification Service
        ↓
Doctor
Referral
Referral accepted
        ↓
Notification Service
        ↓
Referring doctor
Review
Consultation completed
        ↓
Notification Service
        ↓
Patient
12. Role-based access is VERY important

Because you already have multiple roles, each role should see only what it needs.

Patient

Can:

Book appointment
View appointment
View prescription
Select lab
View lab report
View referral status
Submit doctor review
Doctor

Can:

View patients
Conduct consultation
Prescribe tests
View lab reports
Create referral
View referral outcome
Write prescription
View appointments
Receptionist

Can:

Create doctor slots
View appointment requests
Verify patient
Approve/reject appointments
Manage schedules
Lab

Can:

Receive test orders
Accept/reject
Manage sample
Upload report
Mark report completed
Hospital / Facility

Can:

Receive referrals
Accept/reject referral
Schedule patient
Add consultation outcome
Admin

Can:

Manage doctors
Manage labs
Manage facilities
Monitor referrals
Monitor appointments
Handle disputes/issues
13. The complete AAROGYA.AI architecture

If I were building this with your existing stack, I'd make it:

                    ┌─────────────────┐
                    │   PATIENT APP   │
                    │ Next.js / Expo  │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │   BACKEND API   │
                    │ Next.js / Node  │
                    └────────┬────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ↓               ↓                ↓
       APPOINTMENT        CONSULTATION      REFERRAL
          SERVICE            SERVICE          SERVICE
             │               │                │
             ↓               ↓                ↓
          DOCTOR             LAB         OTHER FACILITY
          SLOTS            SERVICE
             │               │
             └───────────────┼────────────────┘
                             ↓
                     ┌──────────────┐
                     │   MONGODB    │
                     │              │
                     │ Patient      │
                     │ Consultation│
                     │ Appointment  │
                     │ Lab          │
                     │ Referral     │
                     │ Prescription │
                     │ Review       │
                     └──────┬───────┘
                            │
               ┌────────────┼────────────┐
               ↓            ↓            ↓
          Notification      AI       File Storage
            Service       + RAG       Reports
14. How AI fits into all of this

Don't put AI everywhere.

Your AI should mainly sit around the clinical information, not control the entire system.

For example:

Patient symptoms
      ↓
AI Intake
      ↓
RAG
      ↓
Preliminary Triage
      ↓
Doctor
      ↓
Prescription / Lab / Referral
      ↓
Follow-up

Then AI can also help with:

Lab

Read/structure report → doctor reviews

Referral

Summarize patient's relevant history → doctor reviews

Consultation

Generate consultation summary → doctor approves

Follow-up

Remind patient / summarize previous case

The doctor should remain the final decision-maker for diagnosis, prescription and referral.

15. One feature I would add to connect everything

You should create a central object called:

Clinical Case / Care Episode

For example:

CARE-2026-00123

Everything related to one medical issue gets connected to this:

CARE EPISODE
     │
     ├── Appointment
     │
     ├── Consultation
     │
     ├── Prescription
     │
     ├── Lab Order
     │      └── Lab Report
     │
     ├── Referral
     │      └── Referral Outcome
     │
     └── Follow-up

This is much better than having four isolated modules.

Then a doctor opening the case sees:

Patient Rahul — Diabetes Follow-up

and underneath:

Appointment → Consultation → Prescription → Lab → Referral → Follow-up

That gives you the "one patient, one clinical context" architecture we discussed earlier.



--------------------------------------------------------------------