module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"resume_share_links",
		{
			resume_share_links_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			resumes_uploaded_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "resumes_uploaded",
					key: "resumes_uploaded_id",
				},
				onDelete: "CASCADE",
			},
			email: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			client_name: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			share_type: {
				type: DataTypes.ENUM("email", "link"),
				allowNull: true,
			},
			expires_at: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			referrer_url: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
		},
		{
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			paranoid: true,
			deletedAt: "deleted_at",
			freezeTableName: true,
			tableName: "resume_share_links",
			underscored: true,
			indexes: [
				{
					name: "idx_resumes_uploaded_id",
					fields: ["resumes_uploaded_id"],
				},
			],
		}
	);
};