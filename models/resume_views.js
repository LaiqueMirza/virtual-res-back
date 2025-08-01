module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"resume_views",
		{
			resume_views_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			resume_share_links_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "resume_share_links",
					key: "resume_share_links_id",
				},
			},
			viewer_ip: {
				type: DataTypes.STRING(64),
				allowNull: true,
			},
			device_type: {
				type: DataTypes.STRING(128),
				allowNull: true,
			},
			browser_info: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			user_agent: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			location_city: {
				type: DataTypes.STRING(128),
				allowNull: true,
			},
			location_country: {
				type: DataTypes.STRING(128),
				allowNull: true,
			},
			total_time_spent: {
				type: DataTypes.TIME,
				allowNull: true,
			},
			view_end_time: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			scroll_percentage: {
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
			tableName: "resume_views",
			underscored: true,
			indexes: [
				{
					name: "idx_resume_views_resume_share_links_id",
					fields: ["resume_share_links_id"],
				},
			],
		}
	);
};