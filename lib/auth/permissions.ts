import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  inquiry: ["read", "create", "update", "assign"],
  client: ["read", "create", "update", "delete"],
  project: ["read", "create", "update", "delete", "assign"],
  crew: ["read", "update", "assign"],
  schedule: ["read", "create", "update", "delete"],
  quote: ["read", "create", "update", "approve"],
  media: ["read", "upload", "update", "delete", "share"],
  deliverable: ["read", "create", "update", "deliver"],
  content: ["read", "create", "update", "publish"],
  report: ["read"],
  settings: ["read", "update"],
} as const;

const access = createAccessControl(statement);

const ownerPermissions = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  inquiry: ["read", "create", "update", "assign"],
  client: ["read", "create", "update", "delete"],
  project: ["read", "create", "update", "delete", "assign"],
  crew: ["read", "update", "assign"],
  schedule: ["read", "create", "update", "delete"],
  quote: ["read", "create", "update", "approve"],
  media: ["read", "upload", "update", "delete", "share"],
  deliverable: ["read", "create", "update", "deliver"],
  content: ["read", "create", "update", "publish"],
  report: ["read"],
  settings: ["read", "update"],
} as const;

export const studioRoles = {
  owner: access.newRole(ownerPermissions),
  admin: access.newRole(ownerPermissions),
  "production-manager": access.newRole({
    inquiry: ["read", "update", "assign"],
    client: ["read", "create", "update"],
    project: ["read", "create", "update", "assign"],
    crew: ["read", "update", "assign"],
    schedule: ["read", "create", "update", "delete"],
    quote: ["read", "create", "update"],
    media: ["read", "upload", "update", "share"],
    deliverable: ["read", "create", "update", "deliver"],
    report: ["read"],
  }),
  "department-lead": access.newRole({
    project: ["read", "update"],
    crew: ["read", "update", "assign"],
    schedule: ["read", "update"],
    media: ["read", "upload"],
    deliverable: ["read", "update"],
  }),
  "finance-commercial": access.newRole({
    inquiry: ["read"],
    client: ["read"],
    project: ["read"],
    quote: ["read", "create", "update", "approve"],
    report: ["read"],
  }),
  "content-editor": access.newRole({
    media: ["read", "upload", "update"],
    content: ["read", "create", "update", "publish"],
  }),
  "crew-member": access.newRole({
    project: ["read"],
    crew: ["read"],
    schedule: ["read"],
    media: ["read"],
    deliverable: ["read", "update"],
  }),
  member: access.newRole({}),
};

export const studioAccessControl = access;
export const studioPermissionStatement = statement;
