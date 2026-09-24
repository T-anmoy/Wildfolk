// Viewport matrix for the Wildfolk responsive QA harness.
// Phones emulate touch + mobile UA at 2x density.
const phone = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const tablet = { isMobile: false, hasTouch: true, deviceScaleFactor: 2 };
const desk = { isMobile: false, hasTouch: false, deviceScaleFactor: 1 };

export const viewports = [
  { label: 'sm-phone', width: 360, height: 640, ...phone },
  { label: 'iphone-se', width: 375, height: 667, ...phone },
  { label: 'iphone', width: 390, height: 844, ...phone },
  { label: 'iphone-pro', width: 393, height: 852, ...phone },
  { label: 'android', width: 412, height: 915, ...phone },
  { label: 'iphone-max', width: 430, height: 932, ...phone },
  { label: 'phone-landscape', width: 844, height: 390, ...phone },
  { label: 'ipad-mini', width: 768, height: 1024, ...tablet },
  { label: 'ipad-air', width: 820, height: 1180, ...tablet },
  { label: 'ipad-pro11', width: 834, height: 1194, ...tablet },
  { label: 'tablet-landscape', width: 1024, height: 768, ...tablet },
  { label: 'ipad-pro13', width: 1024, height: 1366, ...tablet },
  { label: 'laptop-short', width: 1280, height: 720, ...desk },
  { label: 'laptop-hd', width: 1366, height: 768, ...desk },
  { label: 'desktop', width: 1440, height: 900, ...desk },
  { label: 'fullhd', width: 1920, height: 1080, ...desk },
  { label: 'ultrawide', width: 2560, height: 1080, ...desk },
  { label: 'qhd', width: 2560, height: 1440, ...desk },
];

const QUICK = ['iphone', 'phone-landscape', 'tablet-landscape', 'desktop', 'ultrawide'];

export const matrix = process.env.WF_QA_QUICK ? viewports.filter((v) => QUICK.includes(v.label)) : viewports;

export const byLabel = (label) => viewports.find((v) => v.label === label);
