import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'home_screen.dart';
import '../config/api_config.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _fullnameController = TextEditingController();
  final TextEditingController _lineIdController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmController = TextEditingController();

  bool _isObscurePass = true;
  bool _isObscureConfirm = true;
  bool _isLoading = false;

  Future<void> _signup() async {
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final fullname = _fullnameController.text.trim();
    final lineId = _lineIdController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (username.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("กรุณากรอก Username")));
      return;
    }

    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("กรุณากรอก Email Address")));
      return;
    }
    final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
    if (!emailRegex.hasMatch(email)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("รูปแบบ Email Address ไม่ถูกต้อง")));
      return;
    }

    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("กรุณากรอก Phone Number")));
      return;
    }
    if (phone.length != 10 || !RegExp(r'^\d+$').hasMatch(phone)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("เบอร์โทรศัพท์ต้องเป็นตัวเลขและมีความยาว 10 หลัก")));
      return;
    }

    if (fullname.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("กรุณากรอก Full Name")));
      return;
    }

    if (password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("กรุณากรอก Password")));
      return;
    }
    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร")));
      return;
    }

    if (confirm.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("กรุณากรอก Confirm Password")));
      return;
    }

    if (password != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("ยืนยันรหัสผ่านไม่ตรงกับ Password")));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse(ApiConfig.baseUrl + '/auth/signup'),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "username": username,
          "email": email,
          "phone": phone,
          "fullname": fullname,
          "line_id": lineId,
          "password": password
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ")),
        );
        Navigator.pop(context); // กลับไปหน้า Login
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? "เกิดข้อผิดพลาด")),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildTextField(String label, String hint, TextEditingController controller, {bool isRequired = false, bool isPassword = false, bool isObscure = false, VoidCallback? onToggleObscure}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF3C3C3C)),
            ),
            if (isRequired)
              const Text(
                " *",
                style: TextStyle(color: Colors.red, fontSize: 16, fontWeight: FontWeight.bold),
              ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: isPassword ? isObscure : false,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(isObscure ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                    onPressed: onToggleObscure,
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink background
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header & Mascot
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 3,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "สร้างบัญชีของคุณ",
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.pink[300],
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          "เข้าร่วมเป็นสมาชิกชมรมเหมียวๆ\nเพื่อค้นหาเพื่อนแมวที่ใช่!",
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.black87,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Container(
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.pink[100],
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.pets, size: 40, color: Colors.white),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Signup Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFE4E4), // Light pink card
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    _buildTextField("Username", "Enter Your Username", _usernameController, isRequired: true),
                    _buildTextField("Email Address", "Enter Your Email Address", _emailController, isRequired: true),
                    _buildTextField("Phone Number", "Enter Your Phone Number", _phoneController, isRequired: true),
                    _buildTextField("Full Name", "Enter Your Full Name", _fullnameController, isRequired: true),
                    _buildTextField("Line ID (Optional)", "Enter Your Line ID", _lineIdController),
                    _buildTextField("Password", "Enter Your Password", _passwordController, isRequired: true, isPassword: true, isObscure: _isObscurePass, onToggleObscure: () => setState(() => _isObscurePass = !_isObscurePass)),
                    _buildTextField("Confirm Password", "Confirm Your Password", _confirmController, isRequired: true, isPassword: true, isObscure: _isObscureConfirm, onToggleObscure: () => setState(() => _isObscureConfirm = !_isObscureConfirm)),
                    
                    const SizedBox(height: 20),
                    // SIGN UP Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _signup,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF8A8A), // Salmon pink
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 3,
                          shadowColor: const Color(0xFFFF8A8A).withOpacity(0.4),
                        ),
                        child: _isLoading
                            ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                            : const Text(
                                "SIGN UP",
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 1.2,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Already have an account? ",
                    style: TextStyle(color: Color(0xFF1B3B5A), fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                    },
                    child: const Text(
                      "Sign in",
                      style: TextStyle(
                        color: Color(0xFF1B3B5A),
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
