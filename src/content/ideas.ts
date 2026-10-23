import photos from './proposal-photos.json';

export type IdeaPhotoKey = keyof typeof photos;
export interface Idea {
  slug: string;
  number: string;
  category: string;
  title: string;
  summary: string;
  photos: [IdeaPhotoKey, IdeaPhotoKey];
  photoContext: string;
  overview: string;
  facts: { label: string; value: string }[];
  steps: { title: string; text: string }[];
  considerations: string[];
  sourcePages: { number: number; label: string }[];
}

// Three layout examples adapted from the preserved v02 proposal, not approved programs.
// Photos use the existing source/rights manifest; no new source images are copied.
export const ideas: Idea[] = [
  {
    slug: 'gungri-overnight', number: '01', category: '체류 코스',
    title: '궁리 1박 코스',
    summary: '궁리항의 낮 체험부터 천수만 노을, 홍성에서 보내는 하룻밤까지.',
    photos: ['gungri_new_4.jpg', 'gungri_new_3.jpg'],
    photoContext: '궁리항 현장 사진',
    overview: '궁리항 낮 체험과 에덴힐스 밤 캠프를 잇는 주말 정기 코스입니다. 다음 날 아침 궁리항 어시장으로 돌아와 체험·숙박·지역 소비를 한 동선으로 연결하는 제안입니다.',
    facts: [
      { label: '대상', value: '가족·커플 여행객' },
      { label: '운영 구상', value: '4~10월 주말 · 1박 2일' },
      { label: '관련 제안', value: 'A안 · 궁리 1박 코스' },
    ],
    steps: [
      { title: '낮, 궁리항에서 체험', text: '놀궁리 해상파크, 갯벌·선상 체험을 중심으로 구성.' },
      { title: '해 질 녘, 천수만 드라이브', text: '임해관광도로를 따라 노을을 보는 이동 동선.' },
      { title: '밤, 에덴힐스 캠프', text: '별 보기·소규모 공연·로컬 먹거리를 숙박과 연결.' },
      { title: '다음 날 아침, 다시 궁리항', text: '어시장 방문과 해산물 바비큐로 이어지는 아침 일정.' },
    ],
    considerations: [
      '프로그램·일정·장소는 제안 단계이며 관계기관 협의 후 확정.',
      '날씨·물때에 따른 운영 조건과 숙박 연계 협의 필요.',
    ],
    sourcePages: [{ number: 5, label: '코스 구상' }, { number: 6, label: '1박 코스 일정' }, { number: 8, label: '장소 구성' }],
  },
  {
    slug: 'hongseong-stay-pass', number: '02', category: '지역 소비',
    title: '홍성 1박 패스',
    summary: '홍성에서 머문 하룻밤을 체험 혜택과 지역 소비로 연결하는 패스.',
    photos: ['namdang_restaurants.png', 'namdang_walk.png'],
    photoContext: '남당항 현장 사진',
    overview: '홍성 숙박 영수증을 확인한 여행객에게 코스 체험 혜택 또는 홍성사랑상품권을 제공하는 구상입니다. 궁리 1박 코스와 바비큐·대하·새조개 축제 등 홍성 행사 전체에 적용하는 방향을 검토합니다.',
    facts: [
      { label: '대상', value: '홍성 숙박 이용 여행객' },
      { label: '운영 구상', value: '숙박 확인 후 혜택 제공' },
      { label: '관련 제안', value: 'A안 · 홍성 1박 패스' },
    ],
    steps: [
      { title: '홍성에서 숙박', text: '군내 숙박시설을 이용하고 숙박 영수증 보관.' },
      { title: '숙박 내역 확인', text: '영수증 제출을 통해 홍성 내 숙박 이용 확인.' },
      { title: '혜택 제공', text: '코스 체험 혜택 또는 홍성사랑상품권 제공 검토.' },
    ],
    considerations: [
      '혜택 규모·상품권 지급 방식은 미확정.',
      '기존 사업과의 연동 및 중복 지원 규정 확인 필요.',
      '사진은 지역 참고용이며 참여 점포나 제휴 확정을 뜻하지 않음.',
    ],
    sourcePages: [{ number: 7, label: '패스 구상' }, { number: 8, label: '연계 장소' }],
  },
  {
    slug: 'gungri-brand-meetup', number: '03', category: '정기 모임',
    title: '궁리항 월별 브랜드 모임',
    summary: '매달 한 자동차 브랜드를 주제로, 궁리항에서 만나는 정기 모임.',
    photos: ['cars_stars_bishkek.jpg', 'gungri_new_5.jpg'],
    photoContext: '해외 차량 모임 참고 사진',
    overview: '매달 한 자동차 브랜드를 정해 같은 차를 타는 사람들이 궁리항에 모이는 날을 만드는 제안입니다. 계절별 홍성 방문 소재와 차량 모임을 연결해 겨울 비수기에도 방문 이유를 마련하는 구상입니다.',
    facts: [
      { label: '대상', value: '브랜드·차종별 동호회' },
      { label: '운영 구상', value: '매월 1회 주말 · 연중' },
      { label: '관련 제안', value: 'B안 · 월별 브랜드 모임' },
    ],
    steps: [
      { title: '오후, 궁리항 집결', text: '차량 집결과 브랜드 이벤트를 중심으로 모임 구성.' },
      { title: '노을, 함께 남기는 기록', text: '천수만 낙조를 배경으로 단체 사진 촬영.' },
      { title: '저녁 이후, 홍성에서 머물기', text: '군내 식당·숙박을 연결하고 A안 1박 패스와의 결합 검토.' },
    ],
    considerations: [
      '궁리포구 부지·주차·숙박 협의와 운영 재원 확보가 선행 조건.',
      '브랜드 참여·이름 사용 동의·협찬 규모는 미확정.',
      '쿠폰 비용 부담·발급 방식 협의 필요.',
      '차량 사진은 키르기스스탄의 참고 사진이며 홍성 행사 실적이나 같은 브랜드 모임의 증빙이 아님.',
    ],
    sourcePages: [{ number: 17, label: '모임 구상' }, { number: 21, label: '모임 일정·운영 조건' }],
  },
];

export function getIdeaPhoto(key: IdeaPhotoKey) {
  return photos[key];
}
