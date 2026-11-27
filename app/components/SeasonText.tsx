import React from 'react';

// Keep season endpoints together and in source order inside Arabic prose.
// Ordinary dates, scores and unrelated numbers are left alone.
const range = /((?:19|20)\d{2}\s*[-–/]\s*(?:19|20)\d{2}|[١٢][٠-٩]{3}\s*[-–/]\s*[١٢][٠-٩]{3})/g;
export default function SeasonText({ text }: { text: string }) {
  return <>{text.split(range).map((part, index) => index % 2
    ? <bdi dir="ltr" key={index}>{part}</bdi>
    : <React.Fragment key={index}>{part}</React.Fragment>)}</>;
}
