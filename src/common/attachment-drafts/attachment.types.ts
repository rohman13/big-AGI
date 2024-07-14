import type { FileWithHandle } from 'browser-fs-access';

import type { DConversationId } from '~/common/stores/chat/chat.conversation';
import type { DMessageAttachmentFragment, DMessageFragment } from '~/common/stores/chat/chat.fragments';
import type { DMessageId } from '~/common/stores/chat/chat.message';


// Attachment Draft

export type AttachmentDraft = {
  readonly id: AttachmentDraftId;
  readonly source: AttachmentDraftSource,
  label: string;
  ref: string; // will be used in ```ref\n...``` for instance

  inputLoading: boolean;
  inputError: string | null;
  input?: AttachmentDraftInput;

  // options to convert the input
  converters: AttachmentDraftConverter[]; // List of available converters for this attachment

  outputsConverting: boolean;
  outputsConversionProgress: number | null;
  outputFragments: DMessageAttachmentFragment[];

  // metadata: {
  //   creationDate?: Date; // Creation date of the file
  //   modifiedDate?: Date; // Last modified date of the file
  //   altText?: string; // Alternative text for images for screen readers
  // };
};

export type AttachmentDraftId = string;


// draft source

export type AttachmentDraftSource = {
  media: 'url';
  url: string; // parsed valid url
  refUrl: string; // original text (use this as text ref, otherwise use the url)
} | {
  media: 'file';
  origin: AttachmentDraftSourceOriginFile,
  fileWithHandle: FileWithHandle;
  refPath: string;
} | {
  media: 'text';
  method: 'clipboard-read' | AttachmentDraftSourceOriginDTO;
  textPlain?: string;
  textHtml?: string;
} | {
  // special type for attachments thar are references to self (ego, application) objects
  media: 'ego';
  method: 'ego-fragments';
  label: string;
  egoFragmentsInputData: DraftEgoFragmentsInputData;
};

export type AttachmentDraftSourceOriginFile = 'camera' | 'screencapture' | 'file-open' | 'clipboard-read' | AttachmentDraftSourceOriginDTO;

export type AttachmentDraftSourceOriginDTO = 'drop' | 'paste';


// draft input

export const draftInputMimeEgoFragments = 'application/vnd.agi.ego.fragments';
export const draftInputMimeWebpage = 'application/vnd.agi.webpage';

export type AttachmentDraftInput = {
  mimeType: string; // Original MIME type of the file, or application specific type
  data: string | ArrayBuffer | DraftWebInputData | DraftEgoFragmentsInputData; // The original data of the attachment
  dataSize?: number; // Size of the original data (for plain/simple 1:1 mime)
  altMimeType?: string; // Alternative MIME type for the input
  altData?: string; // Alternative data for the input
  // [media:URL] special for download inputs
  urlImage?: {
    webpDataUrl: string;
    mimeType: string;
    width: number;
    height: number;
  };
  // preview?: AttachmentPreview; // Preview of the input
};

export type DraftWebInputData = {
  pageText?: string;
  pageMarkdown?: string;
  pageCleanedHtml?: string;
  pageTitle?: string;
}

export type DraftEgoFragmentsInputData = {
  fragments: DMessageFragment[];
  conversationTitle: string;
  conversationId: DConversationId;
  messageId: DMessageId;
}


// draft converter

export type AttachmentDraftConverter = {
  id: AttachmentDraftConverterType;
  name: string;
  disabled?: boolean;
  unsupported?: boolean;
  isCheckbox?: boolean; // renders as checkbox and is not exclusive with the others

  // runtime properties
  isActive?: boolean; // checked, for both radio (mutually exclusive) and checkbox (additional) converters

  // outputType: ComposerOutputPartType; // The type of the output after conversion
  // isAutonomous: boolean; // Whether the conversion does not require user input
  // isAsync: boolean; // Whether the conversion is asynchronous
  // progress: number; // Conversion progress percentage (0..1)
  // errorMessage?: string; // Error message if the conversion failed
}

export type AttachmentDraftConverterType =
  | 'text' | 'rich-text' | 'rich-text-cleaner' | 'rich-text-table'
  | 'image-original' | 'image-resized-high' | 'image-resized-low' | 'image-ocr' | 'image-to-default'
  | 'pdf-text' | 'pdf-images'
  | 'docx-to-html'
  | 'url-page-text' | 'url-page-markdown' | 'url-page-html' | 'url-page-image'
  | 'ego-fragments-inlined'
  | 'unhandled';


/*export type AttachmentDraftPreview = {
  renderer: 'noPreview',
  title: string; // A title for the preview
} | {
  renderer: 'textPreview'
  fileName: string; // The name of the file
  snippet: string; // A text snippet for documents
  tooltip?: string; // A tooltip for the preview
} | {
  renderer: 'imagePreview'
  thumbnail: string; // A thumbnail preview for images, videos, etc.
  tooltip?: string; // A tooltip for the preview
};*/