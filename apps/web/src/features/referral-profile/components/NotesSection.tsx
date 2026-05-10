import { useState } from 'react';
import {
  Avatar, Box, Button, CircularProgress,
  Divider, Stack, TextField, Typography,
} from '@mui/material';
import { format } from 'date-fns';

interface Note {
  id: string;
  body: string;
  author: { fullName: string; role: string };
  createdAt: string;
}

interface Props {
  notes: Note[];
  onAddNote: (body: string) => void;
  loading: boolean;
}

export function NotesSection({ notes, onAddNote, loading }: Props) {
  const [body, setBody] = useState('');

  const handleSubmit = () => {
    if (!body.trim()) return;
    onAddNote(body.trim());
    setBody('');
  };

  return (
    <Stack spacing={3}>
      {/* Add note */}
      <Box>
        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          placeholder="Add a note visible to all team members…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Box mt={1} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            size="small"
            disabled={!body.trim() || loading}
            onClick={handleSubmit}
            startIcon={loading ? <CircularProgress size={14} /> : undefined}
          >
            {loading ? 'Saving…' : 'Add note'}
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* Notes feed */}
      {notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No notes yet. Add the first one above.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {notes.map((note) => (
            <Stack key={note.id} direction="row" spacing={1.5}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.light' }}>
                {note.author.fullName[0]}
              </Avatar>
              <Box flex={1}>
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="body2" fontWeight={600}>{note.author.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {note.author.role.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" ml="auto">
                    {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                  </Typography>
                </Stack>
                <Typography variant="body2" mt={0.5} whiteSpace="pre-wrap">
                  {note.body}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
