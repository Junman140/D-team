import { admin, organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { studioAccessControl, studioRoles } from "@/lib/auth/permissions";

const adminAccess = createAccessControl({
  user: ["create", "list", "set-role", "ban", "delete", "set-password", "set-email", "get", "update"],
  session: ["list", "revoke", "delete"],
} as const);

const adminRole = adminAccess.newRole({
  user: ["create", "list", "set-role", "ban", "delete", "set-password", "set-email", "get", "update"],
  session: ["list", "revoke", "delete"],
});
const regularUserRole = adminAccess.newRole({ user: [], session: [] });

export const authOptions = {
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  plugins: [
    admin({
      ac: adminAccess,
      roles: { admin: adminRole, user: regularUserRole },
      defaultRole: "user",
    }),
    organization({
      ac: studioAccessControl,
      roles: studioRoles,
      allowUserToCreateOrganization: false,
      organizationLimit: 1,
    }),
  ],
};
