export const statsData = {
  totalUsers: 78,
  totalPosters: 32,
  totalAdopters: 46,
  totalCats: 120,
  adoptedCats: 39,
  findingHomeCats: 81
};

export const thaiMonths = [
  { label: 'มกราคม', value: '1', name: 'มกราคม', short: 'ม.ค.' },
  { label: 'กุมภาพันธ์', value: '2', name: 'กุมภาพันธ์', short: 'ก.พ.' },
  { label: 'มีนาคม', value: '3', name: 'มีนาคม', short: 'มี.ค.' },
  { label: 'เมษายน', value: '4', name: 'เมษายน', short: 'เม.ย.' },
  { label: 'พฤษภาคม', value: '5', name: 'พฤษภาคม', short: 'พ.ค.' },
  { label: 'มิถุนายน', value: '6', name: 'มิถุนายน', short: 'มิ.ย.' },
  { label: 'กรกฎาคม', value: '7', name: 'กรกฎาคม', short: 'ก.ค.' },
  { label: 'สิงหาคม', value: '8', name: 'สิงหาคม', short: 'ส.ค.' },
  { label: 'กันยายน', value: '9', name: 'กันยายน', short: 'ก.ย.' },
  { label: 'ตุลาคม', value: '10', name: 'ตุลาคม', short: 'ต.ค.' },
  { label: 'พฤศจิกายน', value: '11', name: 'พฤศจิกายน', short: 'พ.ย.' },
  { label: 'ธันวาคม', value: '12', name: 'ธันวาคม', short: 'ธ.ค.' },
];

export const monthlyAdoptionData = [
  { name: 'มกราคม', added: 12, adopted: 2 },
  { name: 'กุมภาพันธ์', added: 18, adopted: 5 },
  { name: 'มีนาคม', added: 25, adopted: 8 },
  { name: 'เมษายน', added: 30, adopted: 10 },
  { name: 'พฤษภาคม', added: 15, adopted: 7 },
  { name: 'มิถุนายน', added: 20, adopted: 7 },
  { name: 'กรกฎาคม', added: 22, adopted: 9 },
  { name: 'สิงหาคม', added: 28, adopted: 12 },
  { name: 'กันยายน', added: 19, adopted: 8 },
  { name: 'ตุลาคม', added: 24, adopted: 11 },
  { name: 'พฤศจิกายน', added: 16, adopted: 6 },
  { name: 'ธันวาคม', added: 26, adopted: 14 },
];

export const userTypesData = [
  { name: 'ผู้ลงประกาศ', value: 32 },
  { name: 'ผู้ขอรับเลี้ยง', value: 46 }
];

export const catBreedsDataAll = [
  { name: 'เปอร์เซีย', value: 30 },
  { name: 'สก็อตติช โฟลด์', value: 25 },
  { name: 'วิเชียรมาศ', value: 15 },
  { name: 'ขาวมณี', value: 12 },
  { name: 'อเมริกัน ช็อตแฮร์', value: 10 },
  { name: 'แมวไทย', value: 10 },
  { name: 'สีสวาด', value: 8 },
  { name: 'ศุภลักษณ์', value: 5 },
  { name: 'ไม่ทราบสายพันธุ์', value: 5 },
];

export const catBreedsDataPosters = [
  { name: 'เปอร์เซีย', value: 12 },
  { name: 'สก็อตติช โฟลด์', value: 10 },
  { name: 'วิเชียรมาศ', value: 6 },
  { name: 'ขาวมณี', value: 5 },
  { name: 'อเมริกัน ช็อตแฮร์', value: 4 },
  { name: 'แมวไทย', value: 4 },
  { name: 'สีสวาด', value: 3 },
  { name: 'ศุภลักษณ์', value: 2 },
  { name: 'ไม่ทราบสายพันธุ์', value: 2 },
];

export const catBreedsDataAdopters = [
  { name: 'เปอร์เซีย', value: 18 },
  { name: 'สก็อตติช โฟลด์', value: 15 },
  { name: 'วิเชียรมาศ', value: 9 },
  { name: 'ขาวมณี', value: 7 },
  { name: 'อเมริกัน ช็อตแฮร์', value: 6 },
  { name: 'แมวไทย', value: 6 },
  { name: 'สีสวาด', value: 5 },
  { name: 'ศุภลักษณ์', value: 3 },
  { name: 'ไม่ทราบสายพันธุ์', value: 3 },
];

export const pendingActionsData = [];

export const evaluationCriteriaData = [
  { id: 1, topic: 'พื้นที่ในการเลี้ยง', condition: 'ความพร้อมเท่ากับหรือสูงกว่า', maxScore: 25, scoreRatio: 1.0, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 2, topic: 'พื้นที่ในการเลี้ยง', condition: 'ต่ำกว่าความต้องการ 1 ระดับ', maxScore: 25, scoreRatio: 0.5, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 3, topic: 'พื้นที่ในการเลี้ยง', condition: 'ต่ำกว่าความต้องการ 2 ระดับ', maxScore: 25, scoreRatio: 0.0, isBlocking: true, isActive: true, updated: '17 ก.ย. 69' },
  
  { id: 4, topic: 'งบประมาณต่อเดือน', condition: 'ครอบคลุม 100% ขึ้นไป', maxScore: 25, scoreRatio: 1.0, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 5, topic: 'งบประมาณต่อเดือน', condition: 'ครอบคลุม 80% - 99%', maxScore: 25, scoreRatio: 0.7, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 6, topic: 'งบประมาณต่อเดือน', condition: 'ครอบคลุม 60% - 79%', maxScore: 25, scoreRatio: 0.3, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 7, topic: 'งบประมาณต่อเดือน', condition: 'ต่ำกว่า 60%', maxScore: 25, scoreRatio: 0.0, isBlocking: true, isActive: true, updated: '17 ก.ย. 69' },

  { id: 8, topic: 'เวลาในการดูแล', condition: 'ความพร้อมเท่ากับหรือสูงกว่า', maxScore: 25, scoreRatio: 1.0, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 9, topic: 'เวลาในการดูแล', condition: 'ต่ำกว่าความต้องการ 1 ระดับ', maxScore: 25, scoreRatio: 0.5, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 10, topic: 'เวลาในการดูแล', condition: 'ต่ำกว่าความต้องการ 2 ระดับ', maxScore: 25, scoreRatio: 0.0, isBlocking: true, isActive: true, updated: '17 ก.ย. 69' },

  { id: 11, topic: 'ประสบการณ์ในการเลี้ยง', condition: 'ความพร้อมเท่ากับหรือสูงกว่า', maxScore: 25, scoreRatio: 1.0, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 12, topic: 'ประสบการณ์ในการเลี้ยง', condition: 'ต่ำกว่าความต้องการ 1 ระดับ', maxScore: 25, scoreRatio: 0.5, isBlocking: false, isActive: true, updated: '17 ก.ย. 69' },
  { id: 13, topic: 'ประสบการณ์ในการเลี้ยง', condition: 'ต่ำกว่าความต้องการ 2 ระดับ', maxScore: 25, scoreRatio: 0.0, isBlocking: true, isActive: true, updated: '17 ก.ย. 69' },
];

export const usersListData = [
  { id: 1, username: 'xxxx1', email: 'xxxx1@gmail.com', phone: '0000000000', joinDate: '5/01/2569', status: 'Active' },
  { id: 2, username: 'xxxx2', email: 'xxxx2@gmail.com', phone: '1111111111', joinDate: '16/01/2569', status: 'Active' },
  { id: 3, username: 'xxxx3', email: 'xxxx3@gmail.com', phone: '2222222222', joinDate: '3/03/2569', status: 'Active' },
  { id: 4, username: 'catlover99', email: 'catlover99@gmail.com', phone: '0812345678', joinDate: '10/04/2569', status: 'Inactive' },
  { id: 5, username: 'meowmeow', email: 'meowmeow@hotmail.com', phone: '0898765432', joinDate: '12/04/2569', status: 'Active' },
];

export const catsListData = [
  { id: 1, name: 'โอจิ๋ว', breed: 'สก็อตติช โฟลด์', poster: 'xxxxxxxxxx', date: '25/01/2569', status: 'Active', ageCategory: '2 - 6 เดือน (ลูกแมว)', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'เจ๋ง', breed: 'วิเชียรมาศ', poster: 'xxxxxxxxxx', date: '2/01/2569', status: 'Adopted', ageCategory: 'มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)', image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'มีตังค์', breed: 'แมวไทย', poster: 'spppppn', date: '11/02/2569', status: 'Active', ageCategory: 'มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)', image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'ส้มฉุน', breed: 'บริติช ชอร์ตแฮร์', poster: 'catlover99', date: '15/03/2569', status: 'Active', ageCategory: 'มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)', image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'ลูน่า', breed: 'เปอร์เซีย', poster: 'meowmeow', date: '20/04/2569', status: 'Adopted', ageCategory: 'ต่ำกว่า 2 เดือน (ยังไม่หย่านม)', image: 'https://images.unsplash.com/photo-1529778459854-e85294575333?auto=format&fit=crop&w=400&q=80' },
];
