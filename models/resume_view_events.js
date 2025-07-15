module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"resume_view_events",
		{
			resume_view_events_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			resume_views_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "resume_views",
					key: "resume_views_id",
				},
			},
			resume_share_links_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "resume_share_links",
					key: "resume_share_links_id",
				},
			},
			section_name: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			time_spent_seconds: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			scroll_depth: {
				type: DataTypes.INTEGER,
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
			tableName: "resume_view_events",
			underscored: true,
			indexes: [
				{
					name: "idx_resume_view_id",
					fields: ["resume_views_id"],
				},
			],
		}
	);
};