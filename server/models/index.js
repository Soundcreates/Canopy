module.exports = {
  UsersModel: require('./UserModel').UsersModel,
  ForestModel: require('./ForestModel').ForestModel,
  OrganisationModel: require('./OrganisationModel').OrganisationModel,
  OrganisationMemberModel: require('./OrganisationModel').OrganisationMemberModel,
};

//this file is used to export the schemas/models so the drizzle config file can read and use them