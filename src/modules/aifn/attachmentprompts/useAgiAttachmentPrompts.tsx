import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Alert, Box, Button, CircularProgress } from '@mui/joy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import type { AttachmentDraft } from '~/common/attachment-drafts/attachment.types';
import { useShallowStable } from '~/common/util/hooks/useShallowObject';

import { agiAttachmentPrompts } from './agiAttachmentPrompts';


// interface

interface AgiAttachmentPrompts {
  prompts: string[];
  error: Error | null;
  isFetching: boolean;
  isPending: boolean;
  refetch: () => void;
}

export function useAgiAttachmentPrompts(canAutoTrigger: boolean, attachmentDrafts: AttachmentDraft[]): AgiAttachmentPrompts {

  // state
  const [alreadyRan, setAlreadyRan] = React.useState(false);

  // derived
  const fragments = attachmentDrafts.flatMap(draft => draft.outputFragments);
  const fragmentsCount = fragments.length;

  // async operation state
  const { data: prompts = [], error, isPending, isFetching, refetch } = useQuery({
    enabled: canAutoTrigger && fragmentsCount >= 2 && !alreadyRan,
    queryKey: ['aifn-prompts-attachments', ...fragments.map(f => f.fId).sort()],
    queryFn: async ({ signal }) => {
      setAlreadyRan(true);
      return agiAttachmentPrompts(fragments, signal);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    // placeholderData: keepPreviousData,
  });

  // reload to get ready to run again
  const resetAlreadyRan = !fragmentsCount && alreadyRan;
  React.useEffect(() => {
    if (resetAlreadyRan)
      setAlreadyRan(false);
  }, [resetAlreadyRan]);

  return {
    prompts,
    error,
    isFetching,
    isPending,
    refetch,
  };
}


export function useAgiAttachmentPromptsWithButtons(automatic: boolean, attachmentDrafts: AttachmentDraft[]) {

  // external state
  const stableFragments = useShallowStable(attachmentDrafts.flatMap(draft => draft.outputFragments));

  // derived state
  const automaticTrigger = automatic && stableFragments.length >= 2;

  // async operation state
  const { data: prompts, error, isPending, isFetching, refetch } = useQuery({
    enabled: automaticTrigger,
    queryKey: ['aifn-prompts-attachments', ...stableFragments.map(f => f.fId).sort()],
    queryFn: async ({ signal }) => agiAttachmentPrompts(stableFragments, signal),
    staleTime: Infinity,
    // placeholderData: keepPreviousData,
  });

  // callbacks
  const handleRefetch = React.useCallback(async () => refetch(), [refetch]);

  // memoed components

  const hasData = !!prompts && prompts.length > 0;
  const showComponent = hasData || automaticTrigger;

  const component = React.useMemo(() => {
    return !showComponent ? null : (
      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>

        <Button
          variant='outlined'
          color='primary'
          disabled={isFetching}
          endDecorator={
            isFetching ? <CircularProgress color='neutral' sx={{ '--CircularProgress-size': '16px' }} />
              : <AutoFixHighIcon sx={{ fontSize: '20px' }} />
          }
          onClick={handleRefetch}
          sx={{
            px: 3,
            backgroundColor: 'background.surface',
            boxShadow: '0 4px 6px -4px rgb(var(--joy-palette-primary-darkChannel) / 40%)',
            borderRadius: 'sm',
          }}
        >
          {isFetching ? 'Guessing what to do...' : isPending ? 'Guess what to do' : 'What else could we do'}
        </Button>

        {!!error && (
          <Alert variant='soft' color='danger'>
            {error.message || 'Error guessing actions'}
          </Alert>
        )}

      </Box>
    );
  }, [error, handleRefetch, isFetching, isPending, showComponent]);

  return {
    agiAttachmentPrompts: prompts,
    agiAttachmentPromptsRefetch: refetch,
    agiAttachmentPromptsComponent: component,
  };
}