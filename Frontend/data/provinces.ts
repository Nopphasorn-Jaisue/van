export interface Province {
  id: string;
  nameTh: string;
  nameEn: string;
  region: 'ภาคเหนือ' | 'ภาคกลาง' | 'ภาคตะวันออกเฉียงเหนือ' | 'ภาคตะวันออก' | 'ภาคตะวันตก' | 'ภาคใต้';
}

export const thaiProvinces: Province[] = [
  // ภาคเหนือ (เน้นจัดกลุ่มบนสุดเนื่องจากเป็นพื้นที่บริการหลักของ มพ.)
  { id: 'PYO', nameTh: 'พะเยา', nameEn: 'Phayao', region: 'ภาคเหนือ' },
  { id: 'CRI', nameTh: 'เชียงราย', nameEn: 'Chiang Rai', region: 'ภาคเหนือ' },
  { id: 'CMI', nameTh: 'เชียงใหม่', nameEn: 'Chiang Mai', region: 'ภาคเหนือ' },
  { id: 'NAN', nameTh: 'น่าน', nameEn: 'Nan', region: 'ภาคเหนือ' },
  { id: 'LPR', nameTh: 'ลำปาง', nameEn: 'Lampang', region: 'ภาคเหนือ' },
  { id: 'LPH', nameTh: 'ลำพูน', nameEn: 'Lamphun', region: 'ภาคเหนือ' },
  { id: 'PRE', nameTh: 'แพร่', nameEn: 'Phrae', region: 'ภาคเหนือ' },
  { id: 'MSN', nameTh: 'แม่ฮ่องสอน', nameEn: 'Mae Hong Son', region: 'ภาคเหนือ' },
  { id: 'UTD', nameTh: 'อุตรดิตถ์', nameEn: 'Uttaradit', region: 'ภาคเหนือ' },
  { id: 'PLK', nameTh: 'พิษณุโลก', nameEn: 'Phitsanulok', region: 'ภาคเหนือ' },
  { id: 'STH', nameTh: 'สุโขทัย', nameEn: 'Sukhothai', region: 'ภาคเหนือ' },
  { id: 'TAK', nameTh: 'ตาก', nameEn: 'Tak', region: 'ภาคเหนือ' },
  { id: 'KPT', nameTh: 'กำแพงเพชร', nameEn: 'Kamphaeng Phet', region: 'ภาคเหนือ' },
  { id: 'PCT', nameTh: 'พิจิตร', nameEn: 'Phichit', region: 'ภาคเหนือ' },
  { id: 'PCN', nameTh: 'เพชรบูรณ์', nameEn: 'Phetchabun', region: 'ภาคเหนือ' },
  { id: 'NSN', nameTh: 'นครสวรรค์', nameEn: 'Nakhon Sawan', region: 'ภาคเหนือ' },
  { id: 'UTI', nameTh: 'อุทัยธานี', nameEn: 'Uthai Thani', region: 'ภาคเหนือ' },

  // ภาคกลาง
  { id: 'BKK', nameTh: 'กรุงเทพมหานคร', nameEn: 'Bangkok', region: 'ภาคกลาง' },
  { id: 'NBI', nameTh: 'นนทบุรี', nameEn: 'Nonthaburi', region: 'ภาคกลาง' },
  { id: 'PTE', nameTh: 'ปทุมธานี', nameEn: 'Pathum Thani', region: 'ภาคกลาง' },
  { id: 'SPK', nameTh: 'สมุทรปราการ', nameEn: 'Samut Prakan', region: 'ภาคกลาง' },
  { id: 'AYA', nameTh: 'พระนครศรีอยุธยา', nameEn: 'Phra Nakhon Si Ayutthaya', region: 'ภาคกลาง' },
  { id: 'ATG', nameTh: 'อ่างทอง', nameEn: 'Ang Thong', region: 'ภาคกลาง' },
  { id: 'LBI', nameTh: 'ลพบุรี', nameEn: 'Lopburi', region: 'ภาคกลาง' },
  { id: 'SBR', nameTh: 'สิงห์บุรี', nameEn: 'Sing Buri', region: 'ภาคกลาง' },
  { id: 'CNF', nameTh: 'ชัยนาท', nameEn: 'Chai Nat', region: 'ภาคกลาง' },
  { id: 'SRB', nameTh: 'สระบุรี', nameEn: 'Saraburi', region: 'ภาคกลาง' },
  { id: 'NPT', nameTh: 'นครปฐม', nameEn: 'Nakhon Pathom', region: 'ภาคกลาง' },
  { id: 'SKN', nameTh: 'สมุทรสาคร', nameEn: 'Samut Sakhon', region: 'ภาคกลาง' },
  { id: 'SKM', nameTh: 'สมุทรสงคราม', nameEn: 'Samut Songkhram', region: 'ภาคกลาง' },
  { id: 'SPB', nameTh: 'สุพรรณบุรี', nameEn: 'Suphan Buri', region: 'ภาคกลาง' },

  // ภาคตะวันออกเฉียงเหนือ
  { id: 'KKN', nameTh: 'ขอนแก่น', nameEn: 'Khon Kaen', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'UDT', nameTh: 'อุดรธานี', nameEn: 'Udon Thani', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'NMA', nameTh: 'นครราชสีมา', nameEn: 'Nakhon Ratchasima', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'UBN', nameTh: 'อุบลราชธานี', nameEn: 'Ubon Ratchathani', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'NKI', nameTh: 'หนองคาย', nameEn: 'Nong Khai', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'BKN', nameTh: 'บึงกาฬ', nameEn: 'Bueng Kan', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'NBL', nameTh: 'หนองบัวลำภู', nameEn: 'Nong Bua Lamphu', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'LEI', nameTh: 'เลย', nameEn: 'Loei', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'SKN2', nameTh: 'สกลนคร', nameEn: 'Sakon Nakhon', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'NPM', nameTh: 'นครพนม', nameEn: 'Nakhon Phanom', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'MKM', nameTh: 'มหาสารคาม', nameEn: 'Maha Sarakham', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'RET', nameTh: 'ร้อยเอ็ด', nameEn: 'Roi Et', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'KST', nameTh: 'กาฬสินธุ์', nameEn: 'Kalasin', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'MSN2', nameTh: 'มุกดาหาร', nameEn: 'Mukdahan', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'CPM', nameTh: 'ชัยภูมิ', nameEn: 'Chaiyaphum', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'YST', nameTh: 'ยโสธร', nameEn: 'Yasothon', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'ACR', nameTh: 'อำนาจเจริญ', nameEn: 'Amnat Charoen', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'BRM', nameTh: 'บุรีรัมย์', nameEn: 'Buri Ram', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'SRN', nameTh: 'สุรินทร์', nameEn: 'Surin', region: 'ภาคตะวันออกเฉียงเหนือ' },
  { id: 'SSK', nameTh: 'ศรีสะเกษ', nameEn: 'Si Sa Ket', region: 'ภาคตะวันออกเฉียงเหนือ' },

  // ภาคตะวันออก
  { id: 'NYK', nameTh: 'นครนายก', nameEn: 'Nakhon Nayok', region: 'ภาคตะวันออก' },
  { id: 'PRI', nameTh: 'ปราจีนบุรี', nameEn: 'Prachin Buri', region: 'ภาคตะวันออก' },
  { id: 'SKW', nameTh: 'สระแก้ว', nameEn: 'Sa Kaeo', region: 'ภาคตะวันออก' },
  { id: 'CCO', nameTh: 'ฉะเชิงเทรา', nameEn: 'Chachoengsao', region: 'ภาคตะวันออก' },
  { id: 'CBI', nameTh: 'ชลบุรี', nameEn: 'Chon Buri', region: 'ภาคตะวันออก' },
  { id: 'RYG', nameTh: 'ระยอง', nameEn: 'Rayong', region: 'ภาคตะวันออก' },
  { id: 'CTI', nameTh: 'จันทบุรี', nameEn: 'Chanthaburi', region: 'ภาคตะวันออก' },
  { id: 'TRT', nameTh: 'ตราด', nameEn: 'Trat', region: 'ภาคตะวันออก' },

  // ภาคตะวันตก
  { id: 'KRI', nameTh: 'กาญจนบุรี', nameEn: 'Kanchanaburi', region: 'ภาคตะวันตก' },
  { id: 'RBR', nameTh: 'ราชบุรี', nameEn: 'Ratchaburi', region: 'ภาคตะวันตก' },
  { id: 'PBI', nameTh: 'เพชรบุรี', nameEn: 'Phetchaburi', region: 'ภาคตะวันตก' },
  { id: 'PKN', nameTh: 'ประจวบคีรีขันธ์', nameEn: 'Prachuap Khiri Khan', region: 'ภาคตะวันตก' },

  // ภาคใต้
  { id: 'CPN', nameTh: 'ชุมพร', nameEn: 'Chumphon', region: 'ภาคใต้' },
  { id: 'RNG', nameTh: 'ระนอง', nameEn: 'Ranong', region: 'ภาคใต้' },
  { id: 'SNI', nameTh: 'สุราษฎร์ธานี', nameEn: 'Surat Thani', region: 'ภาคใต้' },
  { id: 'PNA', nameTh: 'พังงา', nameEn: 'Phangnga', region: 'ภาคใต้' },
  { id: 'PKT', nameTh: 'ภูเก็ต', nameEn: 'Phuket', region: 'ภาคใต้' },
  { id: 'KBI', nameTh: 'กระบี่', nameEn: 'Krabi', region: 'ภาคใต้' },
  { id: 'NRT', nameTh: 'นครศรีธรรมราช', nameEn: 'Nakhon Si Thammarat', region: 'ภาคใต้' },
  { id: 'TRG', nameTh: 'ตรัง', nameEn: 'Trang', region: 'ภาคใต้' },
  { id: 'PLG', nameTh: 'พัทลุง', nameEn: 'Phatthalung', region: 'ภาคใต้' },
  { id: 'STN', nameTh: 'สตูล', nameEn: 'Satun', region: 'ภาคใต้' },
  { id: 'SKA', nameTh: 'สงขลา', nameEn: 'Songkhla', region: 'ภาคใต้' },
  { id: 'PTN', nameTh: 'ปัตตานี', nameEn: 'Pattani', region: 'ภาคใต้' },
  { id: 'YLA', nameTh: 'ยะลา', nameEn: 'Yala', region: 'ภาคใต้' },
  { id: 'NWT', nameTh: 'นราธิวาส', nameEn: 'Narathiwat', region: 'ภาคใต้' }
];
