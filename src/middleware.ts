import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  // If the pathname doesn't end with a slash and does not look like a file with an extension
  if (!url.pathname.endsWith("/") && !url.pathname.includes(".")) {
    return context.redirect(`${url.pathname}/${url.search}`, 301);
  }
  return next();
});
