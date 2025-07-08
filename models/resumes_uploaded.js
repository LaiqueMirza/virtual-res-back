module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"resumes_uploaded",
		{
			resumes_uploaded_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			resume_html: {
				type: DataTypes.TEXT("LONG"),
				allowNull: false,
			},
			resume_json: {
				type: DataTypes.JSON,
				allowNull: false,
			},
			resume_name: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			uploaded_by: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
		},
		{
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			paranoid: true,
			deletedAt: "deleted_at",
			freezeTableName: true,
			tableName: "resumes_uploaded",
			underscored: true,
		}
	);
};
