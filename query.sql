-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS resume_analytics;

-- Use the database
USE resume_analytics;

-- Create resumes_uploaded table
CREATE TABLE IF NOT EXISTS resumes_uploaded (
  resumes_uploaded_id INT PRIMARY KEY AUTO_INCREMENT,
  resume_html LONGTEXT NOT NULL,
  resume_json JSON NOT NULL,
  resume_name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(255) NOT NULL
);


-- ALTER TABLE resumes_uploaded
-- ADD COLUMN resume_json JSON NOT NULL DEFAULT (JSON_OBJECT());

-- Add index for faster queries
CREATE INDEX idx_resume_name ON resumes_uploaded(resume_name);
CREATE INDEX idx_uploaded_at ON resumes_uploaded(created_at);


CREATE TABLE resume_share_links (
  resume_share_links_id INT PRIMARY KEY AUTO_INCREMENT,
  resumes_uploaded_id INT NOT NULL,
  email VARCHAR(255),                   -- Optional: to whom it was shared
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,                  -- Optional: expiry time
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_resumes_uploaded_id FOREIGN KEY (resumes_uploaded_id) REFERENCES resumes_uploaded(resumes_uploaded_id)
);

CREATE INDEX idx_resumes_uploaded_id ON resume_share_links(resumes_uploaded_id);

CREATE TABLE resume_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resume_share_links_id INT NOT NULL,                          -- FK to share link
  viewer_ip VARCHAR(64),
  user_agent TEXT,
  location_city VARCHAR(128),
  location_country VARCHAR(128),
  referrer_url TEXT,                             -- If clicked from email, LinkedIn, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,                             -- When tab was closed or idle
  total_duration_seconds INT,
  CONSTRAINT fk_resume_views_resume_share_links_id FOREIGN KEY (resume_share_links_id) REFERENCES resume_share_links(resume_share_links_id)
);

CREATE INDEX idx_resume_views_resume_share_links_id ON resume_views(resume_share_links_id);


CREATE TABLE resume_view_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resume_view_id INT NOT NULL,
  section_name VARCHAR(255),           -- e.g., "Education", "Experience"
  time_spent_seconds INT,              -- How long this section was in view
  scroll_depth INT,                    -- Optional: max scroll % reached
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resume_view_events FOREIGN KEY (resume_view_id) REFERENCES resume_views(id)
);

CREATE INDEX idx_resume_view_id ON resume_view_events(resume_view_id);


CREATE TABLE resume_click_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resume_view_id INT NOT NULL,
  element_id VARCHAR(255),          -- e.g., "download-btn"
  element_text VARCHAR(255),        -- e.g., "Download PDF"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_click_view FOREIGN KEY (resume_view_id) REFERENCES resume_views(id)
);

CREATE INDEX idx_resume_click_events_resume_view_id ON resume_click_events(resume_view_id);


