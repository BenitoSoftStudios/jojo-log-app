// Coded inline SVG animal avatars — no image files, no external URLs.
// All SVGs use a 40×40 viewBox with a soft pastel nursery palette.

export const DEFAULT_ANIMAL = 'duck'

export const ANIMALS = [
  { key: 'duck',   label: 'Duck' },
  { key: 'bunny',  label: 'Bunny' },
  { key: 'bear',   label: 'Bear' },
  { key: 'lamb',   label: 'Lamb' },
  { key: 'cat',    label: 'Cat' },
  { key: 'dog',    label: 'Dog' },
  { key: 'fox',    label: 'Fox' },
  { key: 'frog',   label: 'Frog' },
]

const SVG_REGISTRY = {
  duck: `
    <ellipse cx="20" cy="28" rx="13" ry="8" fill="#EDD88A"/>
    <circle cx="20" cy="18" r="12" fill="#F5E3A0"/>
    <polygon points="27,15 36,18 27,21" fill="#F0A030"/>
    <circle cx="17" cy="15" r="2.2" fill="#6A5840"/>
    <circle cx="17.8" cy="14.2" r="0.8" fill="#ffffff" opacity="0.75"/>
  `,
  bunny: `
    <ellipse cx="14" cy="9" rx="4.5" ry="9" fill="#F5EDE4"/>
    <ellipse cx="26" cy="9" rx="4.5" ry="9" fill="#F5EDE4"/>
    <ellipse cx="14" cy="9" rx="2.2" ry="6" fill="#F2B8C8"/>
    <ellipse cx="26" cy="9" rx="2.2" ry="6" fill="#F2B8C8"/>
    <circle cx="20" cy="23" r="13" fill="#F5EDE4"/>
    <circle cx="15.5" cy="21" r="2" fill="#9870A0"/>
    <circle cx="24.5" cy="21" r="2" fill="#9870A0"/>
    <circle cx="20" cy="26" r="1.8" fill="#F2B8C8"/>
    <circle cx="16.2" cy="20.3" r="0.7" fill="#ffffff" opacity="0.75"/>
    <circle cx="25.2" cy="20.3" r="0.7" fill="#ffffff" opacity="0.75"/>
  `,
  bear: `
    <circle cx="10" cy="11" r="7" fill="#B88A65"/>
    <circle cx="30" cy="11" r="7" fill="#B88A65"/>
    <circle cx="10" cy="11" r="4" fill="#D4A882"/>
    <circle cx="30" cy="11" r="4" fill="#D4A882"/>
    <circle cx="20" cy="23" r="14" fill="#D4A882"/>
    <ellipse cx="20" cy="28" rx="6.5" ry="4.5" fill="#B88A65"/>
    <circle cx="16" cy="20" r="2" fill="#4A3020"/>
    <circle cx="24" cy="20" r="2" fill="#4A3020"/>
    <circle cx="16.7" cy="19.3" r="0.7" fill="#ffffff" opacity="0.7"/>
    <circle cx="24.7" cy="19.3" r="0.7" fill="#ffffff" opacity="0.7"/>
    <circle cx="20" cy="25.5" r="2.2" fill="#4A3020"/>
  `,
  lamb: `
    <circle cx="20" cy="11" r="7" fill="#E8E4DC"/>
    <circle cx="12" cy="16" r="6.5" fill="#E8E4DC"/>
    <circle cx="28" cy="16" r="6.5" fill="#E8E4DC"/>
    <circle cx="8"  cy="24" r="6"   fill="#E8E4DC"/>
    <circle cx="32" cy="24" r="6"   fill="#E8E4DC"/>
    <ellipse cx="12" cy="30" rx="5" ry="3" fill="#DDD9D0" transform="rotate(-20 12 30)"/>
    <ellipse cx="28" cy="30" rx="5" ry="3" fill="#DDD9D0" transform="rotate(20 28 30)"/>
    <circle cx="20" cy="28" r="9.5" fill="#F5F0E8"/>
    <circle cx="17" cy="27" r="1.6" fill="#5A4A3A"/>
    <circle cx="23" cy="27" r="1.6" fill="#5A4A3A"/>
    <circle cx="20" cy="30" r="1.5" fill="#C0A898"/>
  `,
  cat: `
    <polygon points="9,19 15,4 21,19" fill="#BFAFC8"/>
    <polygon points="19,19 25,4 31,19" fill="#BFAFC8"/>
    <polygon points="11,18 15,7 19,18" fill="#E0B8CC"/>
    <polygon points="21,18 25,7 29,18" fill="#E0B8CC"/>
    <circle cx="20" cy="24" r="13" fill="#C8BCCF"/>
    <circle cx="15" cy="21" r="2.8" fill="#8DC890"/>
    <circle cx="25" cy="21" r="2.8" fill="#8DC890"/>
    <circle cx="15" cy="21" r="1.4" fill="#3A3030"/>
    <circle cx="25" cy="21" r="1.4" fill="#3A3030"/>
    <circle cx="15.8" cy="20.2" r="0.6" fill="#ffffff" opacity="0.8"/>
    <circle cx="25.8" cy="20.2" r="0.6" fill="#ffffff" opacity="0.8"/>
    <polygon points="18.5,25.5 20,27.5 21.5,25.5" fill="#E8A8B8"/>
  `,
  dog: `
    <ellipse cx="7"  cy="25" rx="5.5" ry="8.5" fill="#B07030" transform="rotate(-8 7 25)"/>
    <ellipse cx="33" cy="25" rx="5.5" ry="8.5" fill="#B07030" transform="rotate(8 33 25)"/>
    <circle cx="20" cy="21" r="14" fill="#D4884A"/>
    <ellipse cx="20" cy="27" rx="6.5" ry="4.5" fill="#B07030"/>
    <circle cx="15" cy="18" r="2.2" fill="#3A2010"/>
    <circle cx="25" cy="18" r="2.2" fill="#3A2010"/>
    <circle cx="15.8" cy="17.2" r="0.8" fill="#ffffff" opacity="0.7"/>
    <circle cx="25.8" cy="17.2" r="0.8" fill="#ffffff" opacity="0.7"/>
    <circle cx="20" cy="24.5" r="2.5" fill="#3A2010"/>
  `,
  fox: `
    <polygon points="7,20 15,3 22,20"  fill="#C85030"/>
    <polygon points="18,20 25,3 33,20" fill="#C85030"/>
    <polygon points="10,19 15,7 20,19"  fill="#F0B870"/>
    <polygon points="20,19 25,7 30,19"  fill="#F0B870"/>
    <circle cx="20" cy="24" r="13" fill="#D46030"/>
    <ellipse cx="20" cy="29" rx="7.5" ry="5" fill="#F5EDE4"/>
    <circle cx="15" cy="20" r="2.2" fill="#3A2010"/>
    <circle cx="25" cy="20" r="2.2" fill="#3A2010"/>
    <circle cx="15.8" cy="19.2" r="0.8" fill="#ffffff" opacity="0.7"/>
    <circle cx="25.8" cy="19.2" r="0.8" fill="#ffffff" opacity="0.7"/>
    <circle cx="20" cy="26.5" r="2" fill="#3A2010"/>
  `,
  frog: `
    <circle cx="13" cy="12" r="7.5" fill="#6AA868"/>
    <circle cx="27" cy="12" r="7.5" fill="#6AA868"/>
    <circle cx="13" cy="11" r="4.5" fill="#F0F0E8"/>
    <circle cx="27" cy="11" r="4.5" fill="#F0F0E8"/>
    <circle cx="13" cy="11" r="2.8" fill="#2A4020"/>
    <circle cx="27" cy="11" r="2.8" fill="#2A4020"/>
    <circle cx="13.9" cy="10.1" r="0.9" fill="#ffffff" opacity="0.7"/>
    <circle cx="27.9" cy="10.1" r="0.9" fill="#ffffff" opacity="0.7"/>
    <circle cx="20" cy="26" r="14" fill="#8DC880"/>
    <ellipse cx="20" cy="29" rx="9" ry="6" fill="#AAD898"/>
    <path d="M13,33 Q20,38 27,33" stroke="#5A9850" stroke-width="2" fill="none" stroke-linecap="round"/>
  `,
}

export function getAnimalSvg(key) {
  return SVG_REGISTRY[key] ?? SVG_REGISTRY[DEFAULT_ANIMAL]
}
