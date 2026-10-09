import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

class EditProfileScreen extends StatefulWidget {
  final int userId;
  final Map<String, dynamic>? userData;
  final Map<String, dynamic>? adopterData;

  const EditProfileScreen({
    super.key,
    required this.userId,
    this.userData,
    this.adopterData,
  });

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  // User Controllers
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _fullnameController = TextEditingController();
  final TextEditingController _lineIdController = TextEditingController();
  final TextEditingController _oldPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  // Adopter State
  String _housingType = 'บ้านเดี่ยว';
  String _spaceSize = 'ปานกลาง';
  String _freeTime = 'ปานกลาง';
  final TextEditingController _budgetController = TextEditingController();
  String _experience = 'พื้นฐาน';
  String _hasChildren = 'ไม่มี';
  String _hasPets = 'ไม่มี';
  final TextEditingController _catsCountController = TextEditingController(text: '0');
  final TextEditingController _dogsCountController = TextEditingController(text: '0');
  final TextEditingController _otherPetsController = TextEditingController();
  String _acceptsSpecialNeeds = 'ไม่พร้อม';

  bool _isLoading = false;
  bool _isOtpSent = false;

  @override
  void initState() {
    super.initState();
    // Initialize User Data
    if (widget.userData != null) {
      _usernameController.text = widget.userData!['username'] ?? '';
      _emailController.text = widget.userData!['email'] ?? '';
      _phoneController.text = widget.userData!['phonenumber'] ?? '';
      _fullnameController.text = widget.userData!['fullname'] ?? '';
      _lineIdController.text = widget.userData!['line_id'] ?? '';
      // Password usually isn't sent back from get, so leave blank or prompt user to fill if they want to change
    }

    // Initialize Adopter Data (Reverse mapping from DB to Dropdown values)
    if (widget.adopterData != null) {
      final data = widget.adopterData!;
      
      if (data['living_space_type'] == 'condo') _housingType = 'คอนโด';
      else if (data['living_space_type'] == 'apartment') _housingType = 'หอพัก';
      else _housingType = 'บ้านเดี่ยว';

      if (data['space_size'] == 'large') _spaceSize = 'กว้างขวาง';
      else if (data['space_size'] == 'small') _spaceSize = 'คับแคบ';
      else _spaceSize = 'ปานกลาง';

      if (data['daily_free_hours'] != null) {
        String hours = data['daily_free_hours'].toString();
        if (hours == 'low') _freeTime = 'น้อย';
        else if (hours == 'high') _freeTime = 'มาก';
        else if (hours == 'medium') _freeTime = 'ปานกลาง';
        else {
          int h = int.tryParse(hours) ?? 0;
          if (h <= 2) _freeTime = 'น้อย';
          else if (h >= 6) _freeTime = 'มาก';
          else _freeTime = 'ปานกลาง';
        }
      }

      if (data['max_monthly_budget'] != null) {
        _budgetController.text = data['max_monthly_budget'].toString();
      }

      if (data['experience'] == 'medium' || data['experience'] == 'beginner') _experience = 'พื้นฐาน';
      else if (data['experience'] == 'high' || data['experience'] == 'experienced') _experience = 'ระดับสูง';
      else _experience = 'ไม่มี';

      int hasChildren = data['has_children'] is int ? data['has_children'] : int.tryParse(data['has_children']?.toString() ?? '0') ?? 0;
      _hasChildren = hasChildren == 1 ? 'มี' : 'ไม่มี';
      
      int hasPets = data['has_other_pets'] is int ? data['has_other_pets'] : int.tryParse(data['has_other_pets']?.toString() ?? '0') ?? 0;
      _hasPets = hasPets == 1 ? 'มี' : 'ไม่มี';

      _catsCountController.text = data['existing_cats_count']?.toString() ?? '0';
      _dogsCountController.text = data['existing_dogs_count']?.toString() ?? '0';
      _otherPetsController.text = data['other_pets_details']?.toString() ?? '';

      int acceptsSpecial = data['accepts_special_needs'] is int ? data['accepts_special_needs'] : int.tryParse(data['accepts_special_needs']?.toString() ?? '0') ?? 0;
      _acceptsSpecialNeeds = acceptsSpecial == 1 ? 'พร้อม' : 'ไม่พร้อม';
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_newPasswordController.text.isNotEmpty) {
      if (_oldPasswordController.text.isEmpty && _otpController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('กรุณากรอกรหัสผ่านเดิม หรือ OTP เพื่อยืนยันการเปลี่ยนรหัสผ่าน')),
        );
        return;
      }
    }

    if (_hasPets == 'มี') {
      int cats = int.tryParse(_catsCountController.text.trim()) ?? 0;
      int dogs = int.tryParse(_dogsCountController.text.trim()) ?? 0;
      String otherPets = _otherPetsController.text.trim();
      if (cats == 0 && dogs == 0 && otherPets.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("กรุณาระบุจำนวนแมว สุนัข หรือสัตว์เลี้ยงอื่นๆ")));
        return;
      }
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // 1. Update User Data
      final userRes = await http.put(
        Uri.parse(ApiConfig.baseUrl + '/auth/user/${widget.userId}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'username': _usernameController.text,
          'email': _emailController.text,
          'phonenumber': _phoneController.text,
          'fullname': _fullnameController.text,
          'line_id': _lineIdController.text,
          'oldPassword': _oldPasswordController.text,
          'newPassword': _newPasswordController.text,
          'otp': _otpController.text,
        }),
      );

      final userData = json.decode(userRes.body);
      if (!userData['success']) {
        throw Exception(userData['message'] ?? 'Failed to update user');
      }

      // 2. Update Adopter Data
      final adopterRes = await http.post(
        Uri.parse(ApiConfig.baseUrl + '/adopters'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': widget.userId,
          'living_space_type': _housingType == 'บ้านเดี่ยว' ? 'house' : (_housingType == 'คอนโด' ? 'condo' : 'apartment'),
          'space_size': _spaceSize == 'กว้างขวาง' ? 'large' : (_spaceSize == 'คับแคบ' ? 'small' : 'medium'),
          'has_other_pets': _hasPets == 'มี' ? 1 : 0,
          'existing_cats_count': _hasPets == 'มี' ? (int.tryParse(_catsCountController.text) ?? 0) : 0,
          'existing_dogs_count': _hasPets == 'มี' ? (int.tryParse(_dogsCountController.text) ?? 0) : 0,
          'other_pets_details': _hasPets == 'มี' ? _otherPetsController.text.trim() : null,
          'daily_free_hours': _freeTime == 'น้อย' ? 'low' : (_freeTime == 'มาก' ? 'high' : 'medium'),
          'experience': _experience == 'พื้นฐาน' ? 'beginner' : (_experience == 'ระดับสูง' ? 'experienced' : 'none'),
          'has_children': _hasChildren == 'มี' ? 1 : 0,
          'accepts_special_needs': _acceptsSpecialNeeds == 'พร้อม' ? 1 : 0,
          'max_monthly_budget': double.tryParse(_budgetController.text) ?? 0.0,
        }),
      );

      final adopterData = json.decode(adopterRes.body);
      if (!adopterData['success']) {
        throw Exception(adopterData['message'] ?? 'Failed to update adopter profile');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('บันทึกข้อมูลสำเร็จ')),
        );
        Navigator.pop(context, true); // Return true to indicate success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('เกิดข้อผิดพลาด: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
      appBar: AppBar(
        title: const Text('แก้ไขข้อมูล', style: TextStyle(color: Colors.black)),
        backgroundColor: const Color(0xFFFFF5F5),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('ข้อมูลบัญชีผู้ใช้', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    _buildTextField('ชื่อผู้ใช้', _usernameController, isRequired: true, validator: (val) => val == null || val.isEmpty ? 'กรุณากรอกชื่อผู้ใช้' : null),
                    _buildTextField('อีเมล', _emailController, isRequired: true, validator: (val) => val == null || val.isEmpty ? 'กรุณากรอกอีเมลด้วยน้า' : null),
                    _buildTextField('เบอร์โทร', _phoneController, isRequired: true, validator: (val) => val == null || val.isEmpty ? 'กรุณากรอกเบอร์โทรศัพท์ด้วยน้า' : null),
                    _buildTextField('ชื่อ-นามสกุล', _fullnameController, isRequired: true, validator: (val) => val == null || val.isEmpty ? 'กรุณากรอกชื่อ-นามสกุล' : null),
                    _buildTextField('Line ID', _lineIdController),
                    _buildTextField('รหัสผ่านเดิม (เว้นว่างหากไม่ต้องการเปลี่ยน)', _oldPasswordController, obscureText: true),
                    _buildTextField('รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)', _newPasswordController, obscureText: true),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          setState(() {
                            _isOtpSent = true;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('ระบบได้ทำการส่ง OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว')),
                          );
                        },
                        child: const Text('ลืมรหัสผ่านเดิม? (ส่ง OTP)', style: TextStyle(color: Colors.pink)),
                      ),
                    ),
                    if (_isOtpSent)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: TextFormField(
                          controller: _otpController,
                          decoration: const InputDecoration(
                            labelText: 'รหัส OTP ', 
                            border: OutlineInputBorder()
                          ),
                        ),
                      ),
                    
                    const SizedBox(height: 24),
                    const Text('ข้อมูลสำหรับการรับเลี้ยงน้องแมว 🐾', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    _buildDropdown('ลักษณะที่พักอาศัย', _housingType, [
                      {'value': 'บ้านเดี่ยว', 'label': 'บ้านเดี่ยว / ทาวน์โฮม'},
                      {'value': 'คอนโด', 'label': 'คอนโดมิเนียม'},
                      {'value': 'หอพัก', 'label': 'หอพัก / อพาร์ตเมนต์'}
                    ], (val) {
                      setState(() => _housingType = val!);
                    }),
                    _buildDropdown('พื้นที่ใช้สอยโดยประมาณ', _spaceSize, [
                      {'value': 'กว้างขวาง', 'label': 'กว้างขวาง (มีพื้นที่ให้น้องวิ่งเล่น)'},
                      {'value': 'ปานกลาง', 'label': 'ปานกลาง (พอมีมุมส่วนตัวให้น้อง)'},
                      {'value': 'คับแคบ', 'label': 'ค่อนข้างจำกัด / กะทัดรัด'}
                    ], (val) {
                      setState(() => _spaceSize = val!);
                    }),
                    _buildDropdown('เวลาคลุกคลีกับน้องแมวต่อวัน', _freeTime, [
                      {'value': 'น้อย', 'label': 'ค่อนข้างน้อย (น้อยกว่า 2 ชั่วโมง)'},
                      {'value': 'ปานกลาง', 'label': 'พอมีเวลา (2-4 ชั่วโมง)'},
                      {'value': 'มาก', 'label': 'มีเวลาเยอะ (มากกว่า 4 ชั่วโมง)'}
                    ], (val) {
                      setState(() => _freeTime = val!);
                    }),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
                      child: RichText(
                        text: const TextSpan(
                          text: 'งบประมาณสำหรับดูแลน้องแมวต่อเดือน (บาท)',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
                          children: [
                            TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ),
                    TextFormField(
                      controller: _budgetController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        hintText: 'เช่น 3000',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      validator: (val) {
                        if (val == null || val.isEmpty) return 'กรุณากรอกงบประมาณ';
                        if (double.tryParse(val) == null) return 'กรุณากรอกตัวเลขที่ถูกต้อง';
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    _buildDropdown('ประสบการณ์การเลี้ยงแมว', _experience, [
                      {'value': 'ไม่มี', 'label': 'มือใหม่ (ยังไม่เคยเลี้ยงแมว)'},
                      {'value': 'พื้นฐาน', 'label': 'ระดับพื้นฐาน (เคยเลี้ยงหรือดูแลบ้าง)'},
                      {'value': 'ระดับสูง', 'label': 'เชี่ยวชาญ (เป็นทาสแมวตัวยง!)'}
                    ], (val) {
                      setState(() => _experience = val!);
                    }),
                    _buildDropdown('มีเด็กเล็กในบ้านหรือไม่?', _hasChildren, [
                      {'value': 'ไม่มี', 'label': 'ไม่มีเด็กเล็ก'},
                      {'value': 'มี', 'label': 'มีเด็กเล็ก'}
                    ], (val) {
                      setState(() => _hasChildren = val!);
                    }),
                    _buildDropdown('ปัจจุบันมีสัตว์เลี้ยงอื่นหรือไม่?', _hasPets, [
                      {'value': 'ไม่มี', 'label': 'ไม่มี'},
                      {'value': 'มี', 'label': 'มีอยู่แล้ว'}
                    ], (val) {
                      setState(() => _hasPets = val!);
                    }),
                    if (_hasPets == 'มี') ...[
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildNumberSpinner('น้องแมวที่มีอยู่ (ตัว)', _catsCountController),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildNumberSpinner('น้องหมาที่มีอยู่ (ตัว)', _dogsCountController),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      const Padding(
                        padding: EdgeInsets.only(bottom: 8.0, left: 4.0),
                        child: Text(
                          "สัตว์เลี้ยงชนิดอื่นๆ (ถ้ามี)",
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                      ),
                      TextFormField(
                        controller: _otherPetsController,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.white,
                          hintText: "เช่น นก 1 ตัว, กระต่าย 2 ตัว",
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                    
                    _buildDropdown('ยินดีรับดูแลน้องแมวที่ต้องการความใส่ใจเป็นพิเศษไหม? (เช่น น้องที่ป่วยเรื้อรัง หรือพิการ)', _acceptsSpecialNeeds, const [
                      {'label': 'ยังไม่สะดวกในตอนนี้', 'value': 'ไม่พร้อม'},
                      {'label': 'ยินดีและพร้อมดูแลอย่างเต็มที่!', 'value': 'พร้อม'}
                    ], (val) => setState(() => _acceptsSpecialNeeds = val!)),

                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.pink[400],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      child: const Text('บันทึกข้อมูลทาสแมว 🐾', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildDropdown(String label, String value, List<Map<String, String>> items, void Function(String?) onChanged) {
    String currentValue = items.any((e) => e['value'] == value) ? value : items.first['value']!;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
            child: RichText(
              text: TextSpan(
                text: label,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
                children: const [
                  TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            value: currentValue,
            items: items.map((e) => DropdownMenuItem(value: e['value'], child: Text(e['label']!))).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
  Widget _buildTextField(String label, TextEditingController controller, {bool isRequired = false, bool obscureText = false, String? hintText, String? Function(String?)? validator}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
            child: RichText(
              text: TextSpan(
                text: label,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
                children: isRequired ? const [TextSpan(text: ' *', style: TextStyle(color: Colors.red))] : [],
              ),
            ),
          ),
          TextFormField(
            controller: controller,
            obscureText: obscureText,
            decoration: InputDecoration(
              hintText: hintText,
              border: const OutlineInputBorder(),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            validator: validator,
          ),
        ],
      ),
    );
  }

  Widget _buildNumberSpinner(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
          child: RichText(
            text: TextSpan(
              text: label,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
              children: const [
                TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
        ),
        TextFormField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            suffixIcon: Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  InkWell(
                    onTap: () {
                      int val = int.tryParse(controller.text) ?? 0;
                      controller.text = (val + 1).toString();
                    },
                    child: const Icon(Icons.keyboard_arrow_up, size: 24, color: Colors.grey),
                  ),
                  InkWell(
                    onTap: () {
                      int val = int.tryParse(controller.text) ?? 0;
                      if (val > 0) {
                        controller.text = (val - 1).toString();
                      }
                    },
                    child: const Icon(Icons.keyboard_arrow_down, size: 24, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

