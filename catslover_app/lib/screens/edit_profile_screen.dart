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
          'daily_free_hours': _freeTime == 'น้อย' ? 'low' : (_freeTime == 'มาก' ? 'high' : 'medium'),
          'experience': _experience == 'พื้นฐาน' ? 'beginner' : (_experience == 'ระดับสูง' ? 'experienced' : 'none'),
          'has_children': _hasChildren == 'มี' ? 1 : 0,
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
                    const Text('ข้อมูลบัญชี', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _usernameController,
                      decoration: const InputDecoration(labelText: 'ชื่อผู้ใช้', border: OutlineInputBorder()),
                      validator: (val) => val == null || val.isEmpty ? 'กรุณากรอกชื่อผู้ใช้' : null,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(labelText: 'อีเมล', border: OutlineInputBorder()),
                      validator: (val) => val == null || val.isEmpty ? 'กรุณากรอกอีเมล' : null,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _phoneController,
                      decoration: const InputDecoration(labelText: 'เบอร์โทร', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _fullnameController,
                      decoration: const InputDecoration(labelText: 'ชื่อ-นามสกุล', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _lineIdController,
                      decoration: const InputDecoration(labelText: 'Line ID', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _oldPasswordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'รหัสผ่านเดิม (เว้นว่างหากไม่ต้องการเปลี่ยน)', 
                        border: OutlineInputBorder()
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _newPasswordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)', 
                        border: OutlineInputBorder()
                      ),
                    ),
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
                    const Text('ข้อมูลผู้รับเลี้ยง', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    _buildDropdown('ที่พักอาศัย', _housingType, [
                      {'value': 'บ้านเดี่ยว', 'label': 'บ้านเดี่ยว'},
                      {'value': 'คอนโด', 'label': 'คอนโด'},
                      {'value': 'หอพัก', 'label': 'หอพัก'}
                    ], (val) {
                      setState(() => _housingType = val!);
                    }),
                    _buildDropdown('ขนาดพื้นที่', _spaceSize, [
                      {'value': 'กว้างขวาง', 'label': 'กว้างขวาง'},
                      {'value': 'ปานกลาง', 'label': 'ปานกลาง'},
                      {'value': 'คับแคบ', 'label': 'คับแคบ'}
                    ], (val) {
                      setState(() => _spaceSize = val!);
                    }),
                    _buildDropdown('เวลาว่างต่อวัน', _freeTime, [
                      {'value': 'น้อย', 'label': 'น้อย (น้อยกว่า 2 ชั่วโมง)'},
                      {'value': 'ปานกลาง', 'label': 'ปานกลาง (2-4 ชั่วโมง)'},
                      {'value': 'มาก', 'label': 'มาก (มากกว่า 4 ชั่วโมง)'}
                    ], (val) {
                      setState(() => _freeTime = val!);
                    }),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Text('งบประมาณต่อเดือน (บาท)', style: TextStyle(fontWeight: FontWeight.bold)),
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
                    _buildDropdown('ประสบการณ์', _experience, [
                      {'value': 'ไม่มี', 'label': 'ไม่มี/มือใหม่'},
                      {'value': 'พื้นฐาน', 'label': 'พื้นฐาน (เคยเลี้ยง)'},
                      {'value': 'ระดับสูง', 'label': 'ระดับสูง (ดูแลแมวป่วยได้)'}
                    ], (val) {
                      setState(() => _experience = val!);
                    }),
                    _buildDropdown('เด็กเล็กในบ้าน', _hasChildren, [
                      {'value': 'ไม่มี', 'label': 'ไม่มี'},
                      {'value': 'มี', 'label': 'มี'}
                    ], (val) {
                      setState(() => _hasChildren = val!);
                    }),
                    _buildDropdown('สัตว์เลี้ยงอื่น', _hasPets, [
                      {'value': 'ไม่มี', 'label': 'ไม่มี'},
                      {'value': 'มี', 'label': 'มี'}
                    ], (val) {
                      setState(() => _hasPets = val!);
                    }),
                    
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.pink[400],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      child: const Text('บันทึกข้อมูล', style: TextStyle(color: Colors.white, fontSize: 16)),
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
      child: DropdownButtonFormField<String>(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
        value: currentValue,
        items: items.map((e) => DropdownMenuItem(value: e['value'], child: Text(e['label']!))).toList(),
        onChanged: onChanged,
      ),
    );
  }
}
