/**
 * Import HTML as modules
 * https://stackoverflow.com/a/47705264/3323672
 */
declare module '*.html' {
  const content: string;
  export default content;
}

declare module '*.txt' {
  const content: string;
  export default content;
}

declare function GM_addStyle(css: string): void;