const { pgTable, varchar, timestamp, boolean, integer, index, foreignKey } = require('drizzle-orm/pg-core');
const { UsersModel } = require('./UserModel');
const { OrganisationModel } = require('./OrganisationModel');

const InvitationModel = pgTable('invitations', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organisationId: integer().notNull(),
    inviterAddress: varchar().notNull(), // Address of the person sending the invite
    inviteeAddress: varchar().notNull(), // Address of the person being invited
    status: varchar().notNull().default('pending'), // 'pending', 'accepted', 'rejected'
    role: varchar().notNull().default('user'), // 'owner' or 'user'
    createdAt: timestamp().notNull().defaultNow(),
    respondedAt: timestamp(),
}, (table) => ({
    organisationIdIdx: index('invitations_organisation_id_idx').on(table.organisationId),
    inviteeAddressIdx: index('invitations_invitee_address_idx').on(table.inviteeAddress),
    statusIdx: index('invitations_status_idx').on(table.status),
    orgInviteeIdx: index('invitations_org_invitee_idx').on(table.organisationId, table.inviteeAddress),
    inviterFk: foreignKey({
        columns: [table.inviterAddress],
        foreignColumns: [UsersModel.address],
    }),
    inviteeFk: foreignKey({
        columns: [table.inviteeAddress],
        foreignColumns: [UsersModel.address],
    }),
    orgFk: foreignKey({
        columns: [table.organisationId],
        foreignColumns: [OrganisationModel.id],
    }),
}));

module.exports = { InvitationModel };

