module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"resume_click_events",
		{
			resume_click_events_id: {
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
				type: DataTypes.TEXT,
				allowNull: true,
			},
			link: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			element_text: {
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
			tableName: "resume_click_events",
			underscored: true,
			indexes: [
				{
					name: "idx_resume_click_events_resume_view_id",
					fields: ["resume_views_id"],
				},
			],
		}
	);
};