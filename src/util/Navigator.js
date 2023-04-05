import router from "./Router";

export default function attachNavigationEvent() {
  const nav = document.getElementsByTagName('nav')[0]
  nav.addEventListener('click', evt => router(evt.target?.dataset?.path))
}
