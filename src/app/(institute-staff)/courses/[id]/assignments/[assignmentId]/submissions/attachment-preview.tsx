const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg"];

function getExtension(key: string) {
  const dotIndex = key.lastIndexOf(".");
  return dotIndex === -1 ? "" : key.slice(dotIndex + 1).toLowerCase();
}

export function AttachmentPreview({
  attachmentUrl,
  attachmentKey,
}: {
  attachmentUrl: string;
  attachmentKey: string;
}) {
  const extension = getExtension(attachmentKey);

  return (
    <div className="mt-3 flex flex-col gap-2">
      {IMAGE_EXTENSIONS.includes(extension) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachmentUrl}
          alt="Submission attachment"
          className="max-h-[70vh] w-auto rounded-lg border border-border object-contain"
        />
      ) : extension === "pdf" ? (
        <iframe src={attachmentUrl} className="h-[70vh] w-full rounded-lg border-0" />
      ) : (
        <a href={attachmentUrl} target="_blank" rel="noreferrer" className="inline-block text-sm underline">
          Download attachment
        </a>
      )}

      <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
        Open in new tab
      </a>
    </div>
  );
}
