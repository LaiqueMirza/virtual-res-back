module.exports = (db) => {
    // Define model associations
    db.resumes_uploaded.hasMany(db.resume_share_links, {
        foreignKey: "resumes_uploaded_id",
        as: "shareLinks",
    });

    db.resume_share_links.belongsTo(db.resumes_uploaded, {
        foreignKey: "resumes_uploaded_id",
        as: "resume",
    });

    db.resume_share_links.hasMany(db.resume_views, {
        foreignKey: "resume_share_links_id",
        as: "views",
    });

    db.resume_views.belongsTo(db.resume_share_links, {
        foreignKey: "resume_share_links_id",
        as: "shareLink",
    });

    db.resume_views.hasMany(db.resume_view_events, {
        foreignKey: "resume_views_id",
        as: "viewEvents",
    });

    db.resume_view_events.belongsTo(db.resume_views, {
        foreignKey: "resume_views_id",
        as: "view",
    });

    db.resume_views.hasMany(db.resume_click_events, {
        foreignKey: "resume_views_id",
        as: "clickEvents",
    });

    db.resume_click_events.belongsTo(db.resume_views, {
        foreignKey: "resume_views_id",
        as: "view",
    });
}
