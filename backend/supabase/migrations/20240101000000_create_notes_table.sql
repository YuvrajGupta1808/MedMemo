CREATE TABLE notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    session_id  UUID NOT NULL REFERENCES sessions(id),
    audio_path  TEXT NOT NULL,
    summary     TEXT NOT NULL,
    segments    JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notes_session_idx ON notes(session_id);
CREATE INDEX notes_user_idx    ON notes(user_id);
