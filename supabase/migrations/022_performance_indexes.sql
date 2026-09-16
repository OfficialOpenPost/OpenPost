-- Performance indexes for faster queries
-- Run this in Supabase SQL Editor

-- BlogAuthor: speed up author-based queries (post counts, author lookups)
CREATE INDEX IF NOT EXISTS idx_blog_authors_author_id ON blog_authors(author_id);

-- BlogTag: speed up tag-based queries
CREATE INDEX IF NOT EXISTS idx_blog_tags_tag_id ON blog_tags(tag_id);

-- MediaUsage: speed up blog-based media lookups
CREATE INDEX IF NOT EXISTS idx_media_usage_blog_id ON media_usage(blog_id);

-- Poll: speed up blog-based poll lookups
CREATE INDEX IF NOT EXISTS idx_polls_blog_id ON polls(blog_id);

-- Profile: speed up status-based queries (pending users list)
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Invite: speed up pending invites query (projectId + usedAt)
CREATE INDEX IF NOT EXISTS idx_invites_project_used ON invites(project_id, used_at);

-- ProjectMember: speed up owner count and role-based queries
CREATE INDEX IF NOT EXISTS idx_project_members_project_role ON project_members(project_id, role);

-- AuditLog: speed up actor and action lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
