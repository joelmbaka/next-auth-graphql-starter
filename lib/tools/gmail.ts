import {
  GmailGetMessage,
  GmailSearch,
  GmailCreateDraft,
  GmailGetThread,
  GmailSendMessage,
} from '@langchain/community/tools/gmail';

export const getGmailTools = (accessToken: string) => {
  const credentials = {
    accessToken,
  };

  return [
    new GmailGetMessage({ credentials }),
    new GmailSearch({ credentials }),
    new GmailCreateDraft({ credentials }),
    new GmailGetThread({ credentials }),
    new GmailSendMessage({ credentials }),
  ];
};
