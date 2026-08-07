import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;


class CatProfileFormScreen extends StatefulWidget {
  final int userId;
  final Map<String, dynamic>? editCatData;

  const CatProfileFormScreen({super.key, required this.userId, this.editCatData});

  @override
  State<CatProfileFormScreen> createState() => _CatProfileFormScreenState();
}

class _CatProfileFormScreenState extends State<CatProfileFormScreen> {
  int _currentPage = 0; 

  // ==============================
  // ตัวแปรเก็บข้อมูลหน้า 1: ข้อมูลน้องแมว
  // ==============================
  final TextEditingController _catNameController = TextEditingController();
  final TextEditingController _healthDetailsController = TextEditingController();
  String? selectedBreed;
  String? selectedGender;
  String? selectedAge;
  String? sterilizationStatus;
  String? vaccinationStatus;

  final List<String> catBreeds = [
    "วิเชียรมาศ", "ขาวมณี", "เปอร์เซีย", "สีสวาด", "สก็อตติช โฟลด์", 
    "อเมริกัน ช็อตแฮร์", "ศุภลักษณ์", "แมวไทย", "ไม่ทราบสายพันธุ์"
  ];

  final List<String> catAgeRanges = [
    "ต่ำกว่า 2 เดือน (ยังไม่หย่านม)",
    "2 - 6 เดือน (ลูกแมว)",
    "มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)",
    "มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)",
    "มากกว่า 7 ปี (แมวสูงวัย)"
  ];

  // ==============================
  // ตัวแปรเก็บข้อมูลหน้า 2: เงื่อนไข
  // ==============================
  String? requiredHousing;
  String? requiredTime;
  String? requiredOtherPets;
  bool okWithCat = false; 
  bool okWithDog = false; 

  @override
  void initState() {
    super.initState();
    if (widget.editCatData != null) {
      final data = widget.editCatData!;
      _catNameController.text = data['pet_name'] ?? '';
      _healthDetailsController.text = data['health_details'] ?? '';
      
      if (catBreeds.contains(data['pet_breed'])) {
        selectedBreed = data['pet_breed'];
      }

      selectedGender = data['gender'] == 'male' ? 'ผู้' : 'เมีย';
      
      int age = data['age_months'] ?? 12;
      if (age < 2) selectedAge = catAgeRanges[0];
      else if (age <= 6) selectedAge = catAgeRanges[1];
      else if (age <= 12) selectedAge = catAgeRanges[2];
      else if (age <= 84) selectedAge = catAgeRanges[3];
      else selectedAge = catAgeRanges[4];

      sterilizationStatus = data['is_spayed_neutered'] == 1 ? 'ทำหมันแล้ว' : 'ยังไม่ทำหมัน';
      vaccinationStatus = data['is_vaccinated'] == 1 ? 'รับวัคซีนครบแล้ว' : 'ยังไม่รับวัคซีน';
      
      requiredHousing = data['living_space_type'];
      requiredTime = data['daily_free_hours'];
      requiredOtherPets = data['has_other_pets'];
      if (requiredOtherPets == 'เลี้ยงรวมกับสัตว์อื่นได้') {
        okWithCat = true;
        okWithDog = true;
      }
    }
  } 

  void _nextPage() {
    setState(() => _currentPage = 1);
  }

  void _previousPage() {
    setState(() => _currentPage = 0);
  }

Future<void> _submitCatPost() async {
    // 1. จัดเตรียมข้อมูลที่ผู้ใช้กรอกให้อยู่ในรูปแบบ JSON (Map)
    final Map<String, dynamic> catData = {
      "userId": widget.userId,
      "name": _catNameController.text,
      "breed": selectedBreed,
      "gender": selectedGender,
      "ageRange": selectedAge,
      "sterilization": sterilizationStatus,
      "vaccination": vaccinationStatus,
      "healthDetails": _healthDetailsController.text,
      "reqHousing": requiredHousing,
      "reqTime": requiredTime,
      "reqOtherPets": requiredOtherPets,
    };

    try {
      print("กำลังส่งข้อมูลไปยัง Backend: $catData");
      
      http.Response response;
      if (widget.editCatData != null) {
        response = await http.put(
          Uri.parse('http://10.0.2.2:3000/api/cats/${widget.editCatData!['cat_id']}'),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode(catData),
        );
      } else {
        response = await http.post(
          Uri.parse('http://10.0.2.2:3000/api/cats'),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode(catData),
        );
      }

      // 3. เช็กผลลัพธ์ ถ้าเซิร์ฟเวอร์ตอบกลับว่าสำเร็จ (200 หรือ 201)
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext context) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF9EC), // Light yellow/cream background
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      "ระบบได้ทำการบันทึกข้อมูลเบื้องต้นของคุณแล้ว\nขอบคุณสำหรับการให้ข้อมูลเจ้าเหมียว\nเรามั่นใจว่าจะหาบ้านที่เหมาะสมและ\nดีที่สุดสำหรับเจ้าเหมียวที่น่ารักของคุณได้",
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, height: 1.5, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      height: 120,
                      width: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.orange[100],
                      ),
                      child: const Icon(Icons.pets, size: 60, color: Colors.orange),
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context); // ปิด Dialog
                        Navigator.pop(context); // กลับไปหน้า Dashboard
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[300],
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      child: const Text("ดูความคืบหน้า", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    )
                  ],
                ),
              ),
            );
          },
        );
      } else {
        print("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${response.statusCode}");
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
             SnackBar(content: Text('เกิดข้อผิดพลาด: ${response.statusCode}')),
           );
        }
      }
    } catch (e) {
      print("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: $e");
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')),
         );
      }
    }
  }

  @override
  void dispose() {
    _catNameController.dispose();
    _healthDetailsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.pink[300],
          elevation: 0,
          title: const Text(
            "กรุณากรอกรายละเอียดเกี่ยวกับแมว",
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
        ),
        body: Column(
          children: [
            // แถบตกแต่งลายเท้าแมวด้านบน
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              color: Colors.pink[200],
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.pets, color: Colors.white, size: 22),
                  SizedBox(width: 10),
                  Icon(Icons.pets, color: Colors.white, size: 28),
                  SizedBox(width: 10),
                  Icon(Icons.pets, color: Colors.white, size: 22),
                ],
              ),
            ),
            
            // ใช้ AnimatedSwitcher สลับหน้าแบบไม่มีปัญหาเรื่องขนาด
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _currentPage == 0 
                    ? _buildCatInfoStep1() 
                    : _buildCatRequirementsStep2(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // หน้าที่ 1: ข้อมูลทั่วไป & ข้อมูลสุขภาพ
  // ==========================================
  Widget _buildCatInfoStep1() {
    return SingleChildScrollView(
      key: const ValueKey(0),
      physics: const ClampingScrollPhysics(), // ล็อกขอบจอสนิท ดึงยังไงก็ไม่ยืดเห็นสีขาว
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // กล่องข้อมูลทั่วไป
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.pink[100],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Center(
                  child: Text("ข้อมูลทั่วไป", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ),
                const SizedBox(height: 16),
                
                // ช่องอัปโหลดรูป (ปรับความสูงลดลงให้พอดีหน้าจอ)
                Container(
                  height: 120, 
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.pink[300]!, style: BorderStyle.solid, width: 2), 
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.camera_alt, color: Colors.grey, size: 40),
                        SizedBox(height: 8),
                        Text("เพิ่มรูปภาพน้องแมว", style: TextStyle(fontSize: 14, color: Colors.grey)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                const Text("ชื่อน้องแมว (ถ้ามี)", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextField(
                  controller: _catNameController,
                  keyboardType: TextInputType.text, 
                  style: const TextStyle(fontSize: 15),
                  decoration: InputDecoration(
                    isDense: true,
                    filled: true,
                    fillColor: Colors.white,
                    hintText: "กรอกชื่อน้องแมว",
                    hintStyle: TextStyle(fontSize: 14, color: Colors.grey[400]),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),
                
                // สายพันธุ์ และ เพศ
                Row(
                  children: [
                    Expanded(
                      flex: 5,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("สายพันธุ์", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            value: selectedBreed,
                            isExpanded: true,
                            hint: const Text("เลือก", style: TextStyle(fontSize: 14)),
                            items: catBreeds.map((b) => DropdownMenuItem(value: b, child: Text(b, style: const TextStyle(fontSize: 14)))).toList(),
                            onChanged: (val) => setState(() => selectedBreed = val),
                            decoration: InputDecoration(
                              isDense: true,
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 4,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("เพศ", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            value: selectedGender,
                            hint: const Text("เลือก", style: TextStyle(fontSize: 14)),
                            items: ["ผู้", "เมีย"].map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontSize: 14)))).toList(),
                            onChanged: (val) => setState(() => selectedGender = val),
                            decoration: InputDecoration(
                              isDense: true,
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // ช่วงอายุ
                const Text("ช่วงอายุ", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: selectedAge,
                  isExpanded: true, 
                  hint: const Text("เลือกช่วงอายุ", style: TextStyle(fontSize: 14)),
                  items: catAgeRanges.map((a) => DropdownMenuItem(value: a, child: Text(a, style: const TextStyle(fontSize: 14)))).toList(),
                  onChanged: (val) => setState(() => selectedAge = val),
                  decoration: InputDecoration(
                    isDense: true,
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // กล่องข้อมูลด้านสุขภาพ
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.pink[100],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Center(
                  child: Text("ข้อมูลด้านสุขภาพ", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ),
                const SizedBox(height: 16),
                
                // การทำหมัน
                const Text("การทำหมัน", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildRadio("ทำแล้ว", "ทำแล้ว", sterilizationStatus, (val) => setState(() => sterilizationStatus = val)),
                    const SizedBox(width: 20),
                    _buildRadio("ยังไม่ทำ", "ยังไม่ทำ", sterilizationStatus, (val) => setState(() => sterilizationStatus = val)),
                  ],
                ),
                const SizedBox(height: 16),
                
                // วัคซีนพื้นฐาน
                const Text("วัคซีนพื้นฐาน", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _buildRadio("ฉีดครบแล้ว", "ฉีดครบแล้ว", vaccinationStatus, (val) => setState(() => vaccinationStatus = val)),
                        const SizedBox(width: 20),
                        _buildRadio("ยังไม่ฉีด", "ยังไม่ฉีด", vaccinationStatus, (val) => setState(() => vaccinationStatus = val)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildRadio("ยังฉีดไม่ครบ (โปรดระบุเพิ่มเติม)", "ยังฉีดไม่ครบ", vaccinationStatus, (val) => setState(() => vaccinationStatus = val)),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // โรคประจำตัว
                const Text("โรคประจำตัว และข้อมูลเพิ่มเติมด้านสุขภาพ", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextField(
                  controller: _healthDetailsController,
                  keyboardType: TextInputType.text, 
                  maxLines: 2, 
                  style: const TextStyle(fontSize: 15),
                  decoration: InputDecoration(
                    isDense: true,
                    filled: true,
                    fillColor: Colors.white,
                    hintText: "เช่น ไม่มีโรคประจำตัว หรือ เป็นหวัดแมว",
                    hintStyle: TextStyle(fontSize: 14, color: Colors.grey[400]),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                
                const SizedBox(height: 30),
                
                // ปุ่มย้อนกลับและถัดไป
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.pink, 
                          side: const BorderSide(color: Colors.pink, width: 2),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.pop(context), 
                        child: const Text("ย้อนกลับ", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.pink, 
                          foregroundColor: Colors.white, 
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 2,
                        ),
                        onPressed: _nextPage,
                        child: const Text("ถัดไป", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // หน้าที่ 2: เงื่อนไขในการหาบ้าน
  // ==========================================
  Widget _buildCatRequirementsStep2() {
    return SingleChildScrollView(
      key: const ValueKey(1),
      physics: const ClampingScrollPhysics(), // ล็อกขอบจอสนิท ไม่ให้ยืดเห็นขอบขาว
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.pink[100],
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Text("เงื่อนไขในการหาบ้าน", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            ),
            const SizedBox(height: 12),
            const Center(
              child: Text(
                "ข้อมูลส่วนนี้จะนำไปใช้ในการคำนวณค่าความเหมาะสม\nของผู้ขอรับเลี้ยง กรุณากรอกความต้องการของเจ้าเหมียว", 
                style: TextStyle(fontSize: 14, color: Colors.black87, height: 1.4),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            
            // 1. หมวดพื้นที่อยู่อาศัย / บ้าน
            _buildRequirementCard(
              title: "พื้นที่อยู่อาศัย / บ้าน",
              icon: Icons.house_rounded, 
              content: Column(
                children: [
                  _buildSquareCheckbox("พื้นที่โล่งกว้างๆ", requiredHousing == "พื้นที่โล่งกว้างๆ", (val) => setState(() => requiredHousing = "พื้นที่โล่งกว้างๆ")),
                  _buildSquareCheckbox("พอประมาณ", requiredHousing == "พอประมาณ", (val) => setState(() => requiredHousing = "พอประมาณ")),
                  _buildSquareCheckbox("ไม่ต้องการพื้นที่มาก\n(หรือเคยเลี้ยงระบบปิด)", requiredHousing == "ไม่ต้องการพื้นที่มาก", (val) => setState(() => requiredHousing = "ไม่ต้องการพื้นที่มาก")),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. หมวดเวลาและการดูแล
            _buildRequirementCard(
              title: "เวลาและการดูแล",
              icon: Icons.face_retouching_natural, 
              content: Column(
                children: [
                  _buildSquareCheckbox("น้อย : ดูแลตัวเองได้ดี\nไม่ซนไม่ค่อยชอบเล่นกับคน", requiredTime == "น้อย", (val) => setState(() => requiredTime = "น้อย")),
                  _buildSquareCheckbox("ปานกลาง : ดูแลตัวเองได้ดี\nติดเล่นกับคน ไม่มีโรคประจำตัว", requiredTime == "ปานกลาง", (val) => setState(() => requiredTime = "ปานกลาง")),
                  _buildSquareCheckbox("มาก : ติดคนมาก ขี้เหงา\nมีโรคประจำตัว ควรดูแลใกล้ชิด", requiredTime == "มาก", (val) => setState(() => requiredTime = "มาก")),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. หมวดความเข้ากับสัตว์เลี้ยงตัวอื่น
            _buildRequirementCard(
              title: "ความเข้ากับสัตว์เลี้ยงตัวอื่น",
              icon: Icons.pets, 
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSquareCheckbox("เข้ากันได้ดี เคยเลี้ยงรวมกับ", requiredOtherPets == "เข้ากันได้ดี", (val) => setState(() => requiredOtherPets = "เข้ากันได้ดี")),
                  // ตัวเลือกย่อย
                  _buildSquareCheckbox("แมว", okWithCat, (val) {
                    setState(() {
                      okWithCat = val ?? false;
                      if(okWithCat) requiredOtherPets = "เข้ากันได้ดี"; 
                    });
                  }, isSubOption: true),
                  _buildSquareCheckbox("สุนัข", okWithDog, (val) {
                    setState(() {
                      okWithDog = val ?? false;
                      if(okWithDog) requiredOtherPets = "เข้ากันได้ดี";
                    });
                  }, isSubOption: true),
                  
                  _buildSquareCheckbox("ต้องการเลี้ยงเดี่ยว ขี้กลัว", requiredOtherPets == "ต้องการเลี้ยงเดี่ยว", (val) => setState(() => requiredOtherPets = "ต้องการเลี้ยงเดี่ยว")),
                  _buildSquareCheckbox("ไม่เคยเลี้ยงรวมกับสัตว์อื่น", requiredOtherPets == "ไม่เคยเลี้ยงรวม", (val) => setState(() => requiredOtherPets = "ไม่เคยเลี้ยงรวม")),
                ],
              ),
            ),

            const SizedBox(height: 30),
            
            // ปุ่มย้อนกลับ และ บันทึก
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.pink, 
                      side: const BorderSide(color: Colors.pink, width: 2),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _previousPage,
                    child: const Text("ย้อนกลับ", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.pink, 
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                    ),
                    onPressed: _submitCatPost,
                    child: const Text("บันทึก", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // Helper Widgets 
  // ==========================================
  
  Widget _buildRadio(String text, String value, String? groupValue, Function(String?) onChanged) {
    return GestureDetector(
      onTap: () => onChanged(value),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 24,
            width: 24,
            child: Radio<String>(
              value: value,
              groupValue: groupValue,
              onChanged: onChanged,
              activeColor: Colors.pink,
            ),
          ),
          const SizedBox(width: 10),
          Text(text, style: const TextStyle(fontSize: 15)),
        ],
      ),
    );
  }

  Widget _buildRequirementCard({required String title, required IconData icon, required Widget content}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2.0, right: 16.0),
            child: Icon(icon, size: 40, color: Colors.pink[300]),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                content,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSquareCheckbox(String text, bool isSelected, Function(bool?) onChanged, {bool isSubOption = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.0, left: isSubOption ? 34.0 : 0.0), 
      child: GestureDetector(
        onTap: () => onChanged(!isSelected),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: Checkbox(
                value: isSelected,
                onChanged: onChanged,
                activeColor: Colors.pink,
                checkColor: Colors.white,
                side: BorderSide(color: Colors.grey[500]!, width: 1.5),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(fontSize: 14, height: 1.4),
              ),
            ),
          ],
        ),
      ),
    );
  }
}