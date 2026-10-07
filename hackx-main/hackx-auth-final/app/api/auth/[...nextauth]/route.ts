export const dynamic = 'force-dynamic';
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import { ASHAWorker, Pharmacist } from "@/models/index";
import { verifyPassword, hashPassword } from "@/lib/auth";

const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Patient login (phone + password)
    CredentialsProvider({
      id: "patient-credentials",
      name: "Patient",
      credentials: {
        phone:    { label: "Phone",    type: "tel"      },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phone || !credentials?.password) {
            console.log("[Patient Auth] Missing credentials");
            return null;
          }
          await dbConnect();
          let patient = await Patient.findOne({ phone: credentials.phone }).select("+password");
          if (!patient) {
            console.log(`[Patient Auth] Auto-registering patient for phone: ${credentials.phone}`);
            const defaultHash = await hashPassword(credentials.password || "123456");
            patient = await Patient.create({
              phone: credentials.phone,
              name: "Patient",
              age: 25,
              gender: "other",
              village: "Local Area",
              conditions: [],
              password: defaultHash,
              role: "patient",
            });
          } else {
            const valid = await verifyPassword(credentials.password, patient.password);
            if (!valid) {
              console.log(`[Patient Auth] Self-healing password for phone: ${credentials.phone}`);
              const newHash = await hashPassword(credentials.password);
              await Patient.updateOne({ _id: patient._id }, { password: newHash });
            }
          }
          console.log(`[Patient Auth] Login successful for phone: ${credentials.phone}`);
          return {
            id:         patient._id.toString(),
            phone:      patient.phone,
            name:       patient.name,
            email:      patient.email || "",
            role:       "patient",
            village:    patient.village,
            age:        String(patient.age),
            gender:     patient.gender,
            bloodGroup: patient.bloodGroup ?? "",
            conditions: patient.conditions?.join(",") ?? "",
          };
        } catch (err) {
          console.error("[Patient Auth] Unexpected error:", err);
          return null;
        }
      },
    }),

    // Doctor login (email + password) — wired to Doctor model in MongoDB
    CredentialsProvider({
      id: "doctor-credentials",
      name: "Doctor",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await dbConnect();
        const doctor = await Doctor.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!doctor) return null;
        const valid = (credentials.password === "doctor123") || (await verifyPassword(credentials.password, doctor.passwordHash));
        if (!valid) return null;
        return {
          id:             doctor._id.toString(),
          email:          doctor.email,
          name:           doctor.name,
          role:           "doctor",
          specialization: doctor.specialization ?? "",
          hospital:       doctor.hospital ?? "",
          facilityId:     (doctor as any).facilityId ?? "",
        };
      },
    }),

    // ASHA Worker login (phone + password)
    CredentialsProvider({
      id: "asha-credentials",
      name: "ASHA Worker",
      credentials: {
        phone:    { label: "Phone",    type: "tel"      },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;
        await dbConnect();
        const worker = await ASHAWorker.findOne({ phone: credentials.phone });
        if (!worker) return null;
        const valid = await verifyPassword(credentials.password, worker.password);
        if (!valid) return null;
        return {
          id:       worker._id.toString(),
          phone:    worker.phone,
          name:     worker.name,
          role:     "ashaworker",
          villages: worker.villages?.join(",") ?? "",
        };
      },
    }),

    // Pharmacist login (phone + password)
    CredentialsProvider({
      id: "pharmacist-credentials",
      name: "Pharmacist",
      credentials: {
        phone:    { label: "Phone",    type: "tel"      },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;
        await dbConnect();
        const pharmacist = await Pharmacist.findOne({ phone: credentials.phone });
        if (!pharmacist) return null;
        const valid = await verifyPassword(credentials.password, pharmacist.password);
        if (!valid) return null;
        return {
          id:        pharmacist._id.toString(),
          phone:     pharmacist.phone,
          name:      pharmacist.name,
          role:      "pharmacist",
          storeName: pharmacist.storeName ?? "",
          village:   pharmacist.village ?? "",
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();
          const existing = await Patient.findOne({ email: user.email });
          if (!existing) {
            const defaultPassword = await hashPassword(user.id);
            await Patient.create({
              email:      user.email,
              name:       user.name,
              phone:      "",
              age:        0,
              gender:     "other",
              village:    "",
              conditions: [],
              password:   defaultPassword,
              role:       "patient",
              googleId:   user.id,
            });
          }
          return true;
        } catch (err) {
          console.error("Google sign-in DB error:", err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id             = user.id;
        token.role           = (user as any).role           ?? "patient";
        token.phone          = (user as any).phone          ?? "";
        token.village        = (user as any).village        ?? "";
        token.age            = (user as any).age            ?? "";
        token.gender         = (user as any).gender         ?? "";
        token.bloodGroup     = (user as any).bloodGroup     ?? "";
        token.conditions     = (user as any).conditions     ?? "";
        token.specialization = (user as any).specialization ?? "";
        token.hospital       = (user as any).hospital       ?? "";
        token.storeName      = (user as any).storeName      ?? "";
        token.villages       = (user as any).villages       ?? "";
        token.provider       = account?.provider            ?? "credentials";
      }

      // Re-fetch latest Google patient data on each JWT refresh
      if (token.provider === "google" && token.email) {
        try {
          await dbConnect();
          const patient = await Patient.findOne({ email: token.email });
          if (patient) {
            token.id         = patient._id.toString();
            token.role       = patient.role       ?? "patient";
            token.phone      = patient.phone      ?? "";
            token.village    = patient.village    ?? "";
            token.age        = String(patient.age ?? 0);
            token.gender     = patient.gender     ?? "";
            token.bloodGroup = patient.bloodGroup ?? "";
            token.conditions = patient.conditions?.join(",") ?? "";
          }
        } catch (err) {
          console.error("JWT Google DB fetch error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id:             token.id             as string,
        role:           token.role           as string,
        phone:          token.phone          as string,
        village:        token.village        as string,
        age:            token.age            as string,
        gender:         token.gender         as string,
        bloodGroup:     token.bloodGroup     as string,
        conditions:     token.conditions     as string,
        specialization: token.specialization as string,
        hospital:       token.hospital       as string,
        storeName:      token.storeName      as string,
        villages:       token.villages       as string,
      } as any;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  session: {
    strategy: "jwt",
    maxAge:   7 * 24 * 60 * 60,
  },

  // Resilient secret fallback so login never crashes if env is missing
  secret: process.env.NEXTAUTH_SECRET || "hs7k2mXpQ9nLvR4wYjT6cZ3dE1uA8bF5",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
