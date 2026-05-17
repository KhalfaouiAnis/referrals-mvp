import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Stack,
  IconButton,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';

interface FileDropzoneProps {
  onUpload: (file: File, label?: string, onProgress?: (pct: number) => void) => Promise<void>;
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
}

interface UploadState {
  file: File;
  progress: number;
  error: string | null;
  done: boolean;
}

export function FileDropzone({
  onUpload,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMb = 25,
  disabled = false,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const updateUpload = (index: number, patch: Partial<UploadState>) => {
    setUploads((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...patch } : u)),
    );
  };

  const processFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMb * 1024 * 1024) {
        alert(`File exceeds ${maxSizeMb} MB limit.`);
        return;
      }

      const index = uploads.length;
      setUploads((prev) => [
        ...prev,
        { file, progress: 0, error: null, done: false },
      ]);

      try {
        await onUpload(file, undefined, (pct) => {
          updateUpload(index, { progress: pct });
        });
        updateUpload(index, { done: true, progress: 100 });
      } catch {
        updateUpload(index, { error: 'Upload failed. Please retry.' });
      }
    },
    [uploads.length, maxSizeMb, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      files.forEach(processFile);
    },
    [disabled, processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      files.forEach(processFile);
      e.target.value = '';
    },
    [processFile],
  );

  return (
    <Box>
      <Paper
        component="label"
        variant="outlined"
        onDrop={handleDrop}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        sx={{
          p: 4,
          textAlign: 'center',
          borderStyle: 'dashed',
          transition: 'all 0.15s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          borderColor: dragging ? 'primary.main' : 'divider',
          bgcolor: dragging ? 'action.hover' : 'background.paper',
        }}
      >
        <input
          type="file"
          hidden
          multiple
          accept={accept}
          disabled={disabled}
          onChange={handleFileInput}
        />
        <Stack alignItems="center" spacing={1}>
          <UploadFileIcon color="action" fontSize="large" />
          <Typography variant="body2" color="text.secondary">
            Drag &amp; drop files here, or click to browse
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Accepted: {accept} · Max {maxSizeMb} MB per file
          </Typography>
        </Stack>
      </Paper>

      {uploads.length > 0 && (
        <Stack spacing={1} mt={2}>
          {uploads.map((u, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box flex={1}>
                  <Typography variant="caption" noWrap>
                    {u.file.name}
                  </Typography>
                  {!u.done && !u.error && (
                    <LinearProgress
                      variant="determinate"
                      value={u.progress}
                      sx={{ mt: 0.5 }}
                    />
                  )}
                  {u.error && (
                    <Typography variant="caption" color="error">
                      {" "}{u.error}
                    </Typography>
                  )}
                  {u.done && (
                    <Typography variant="caption" color="success.main">
                      {" "}Uploaded ✓
                    </Typography>
                  )}
                </Box>
                <IconButton
                  size="small"
                  onClick={() =>
                    setUploads((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
