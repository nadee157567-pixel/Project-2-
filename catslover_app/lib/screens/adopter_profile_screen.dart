import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'user_profile_screen.dart';
import '../config/api_config.dart';

class AdopterProfileScreen extends StatefulWidget {
  final int userId;
  final int catId;
  final bool isEditing;
  const AdopterProfileScreen({super.key, required this.userId, required this.catId, this.isEditing = false});

  @override
  State<AdopterProfileScreen> createState() => _AdopterProfileScreenState();
}

class _AdopterProfileScreenState extends State<AdopterProfileScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;

  String? housingType;
  String? spaceSize;
  String? hasPets;
  String? freeTime;
  String? experience;
  String? hasChildren;
  String? budget;
  
  bool _isLoading = false;
  bool _isFetching = false;

  @override
  void initState() {
    super.initState();
    if (widget.isEditing) {
      _fetchExistingProfile();
    }
  }

  Future<void> _fetchExistingProfile() async {
    setState(() => _isFetching = true);
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.baseUrl + '/adopters/profile/${widget.userId}')
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['profile'] != null) {
          final profile = data['profile'];
          
          setState(() {
            if (profile['living_space_type'] == 'condo') {
              housingType = 'คอนโด';
            } else if (profile['living_space_type'] == 'apartment') {
              housingType = 'หอพัก';
            } else {
              housingType = 'บ้านเดี่ยว';
            }

            if (profile['space_size'] == 'large') {
              spaceSize = 'กว้างขวาง';
            } else if (profile['space_size'] == 'small') {
              spaceSize = 'คับแคบ';
            } else {
              spaceSize = 'ปานกลาง';
            }

            int hasOtherPets = profile['has_other_pets'] is int ? profile['has_other_pets'] : int.tryParse(profile['has_other_pets']?.toString() ?? '0') ?? 0;
            hasPets = hasOtherPets == 1 ? 'มี' : 'ไม่มี';

            int dailyHours = profile['daily_free_hours'] is int ? profile['daily_free_hours'] : int.tryParse(profile['daily_free_hours']?.toString() ?? '0') ?? 0;
            if (dailyHours <= 2) {
              freeTime = '2';
            } else if (dailyHours >= 6) {
              freeTime = '6';
            } else {
              freeTime = '4';
            }

            if (profile['experience'] == 'beginner') {
              experience = 'พื้นฐาน';
            } else if (profile['experience'] == 'experienced') {
              experience = 'ระดับสูง';
            } else {
              experience = 'มือใหม่';
            }

            int hasChild = profile['has_children'] is int ? profile['has_children'] : int.tryParse(profile['has_children']?.toString() ?? '0') ?? 0;
            hasChildren = hasChild == 1 ? 'มี' : 'ไม่มี';

            double maxBudget = profile['max_monthly_budget'] is double 
                ? profile['max_monthly_budget'] 
                : (profile['max_monthly_budget'] is int 
                    ? profile['max_monthly_budget'].toDouble() 
                    : double.tryParse(profile['max_monthly_budget']?.toString() ?? '0') ?? 0.0);

            if (maxBudget <= 1000) {
              budget = '1000';
            } else if (maxBudget >= 5000) {
              budget = '5000';
            } else {
              budget = '3000';
            }
          });
        }
      }
    } catch (e) {
      print("Error fetching profile: $e");
    } finally {
      setState(() => _isFetching = false);
    }
  }

  void _nextPage() {
    if (_currentStep < 2) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  void _previousPage() {
    if (_currentStep > 0) {
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isLoading = true);
    final Map<String, dynamic> adopterData = {
      "userId": widget.userId,
      "housingType": housingType,
      "spaceSize": spaceSize,
      "hasPets": hasPets,
      "freeTime": freeTime,
      "experience": experience,
      "hasChildren": hasChildren,
      "budget": budget,
    };

    try {
      http.Response response;
      if (widget.isEditing) {
        response = await http.put(
          Uri.parse(ApiConfig.baseUrl + '/adopters/profile/${widget.userId}'),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode(adopterData),
        );
      } else {
        response = await http.post(
          Uri.parse(ApiConfig.baseUrl + '/adopters'),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode(adopterData),
        );
      }

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        
        if (widget.isEditing) {
          // If editing, just pop back to evaluation screen and trigger refresh
          Navigator.pop(context, true);
        } else {
          // Show Success Dialog (Image 4)
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (BuildContext context) {
              return Dialog(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF9EC), // Light cream
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        "ระบบได้ทำการบันทึกข้อมูลเบื้องต้นของคุณแล้ว\nขอบคุณสำหรับที่ตั้งใจทำแบบทดสอบ\nเรามั่นใจว่าจะหาเพื่อนที่เหมาะสมและดีที่สุดสำหรับคุณได้",
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, height: 1.5, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 20),
                      // Cat Image Placeholder
                      Container(
                        height: 150,
                        width: 150,
                        decoration: BoxDecoration(
                          color: Colors.orange[100],
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.pets, size: 80, color: Colors.orange),
                      ),
                      const SizedBox(height: 30),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // ปิด Dialog
                            Navigator.pop(context);
                            // กลับไปหน้าค้นหาแมว (HomeScreen)
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey[300],
                            foregroundColor: Colors.black87,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                            elevation: 0,
                          ),
                          child: const Text("ตกลง", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                        ),
                      )
                    ],
                  ),
                ),
              );
            }
          );
        }
      }
    } catch (e) {
      print("Error: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isFetching) {
      return Scaffold(
        backgroundColor: const Color(0xFFFFF5F5),
        body: const Center(child: CircularProgressIndicator(color: Colors.pink)),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink backgroun
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: const Icon(Icons.arrow_back, color: Colors.black),
          ),
        ),
      ),
      body: Column(
        children: [
          // Profile Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Text(
                    "มาสร้างโปรไฟล์ในการค้นหาเพื่อนใหม่กัน",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => UserProfileScreen(userId: widget.userId),
                      ),
                    );
                  },
                  child: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.brown[300],
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person, color: Colors.white, size: 30),
                  ),
                )
              ],
            ),
          ),
          
          const SizedBox(height: 10),

          // Progress Bar Box
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.pink[100],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Text("ขั้นตอนที่ ${_currentStep + 1} จาก 3", 
                     style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(width: 10),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: (_currentStep + 1) / 3,
                      backgroundColor: Colors.white,
                      color: Colors.redAccent,
                      minHeight: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 10),

          // Form Area
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (index) => setState(() => _currentStep = index),
              children: [
                _buildStep1(),
                _buildStep2(),
                _buildStep3(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // Step 1
  // ==========================================
  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildQuestionContainer(
            question: "ที่พักอาศัยของคุณเป็นแบบไหน ?",
            subtitle: "ตอบคำถามนี้เพื่อวิเคราะห์ความเหมาะสมในการรับเลี้ยงแมว",
            content: Row(
              children: [
                Expanded(child: _buildImageChoice(label: "บ้านเดี่ยว", icon: Icons.house, isSelected: housingType == "บ้านเดี่ยว", onTap: () => setState(() => housingType = "บ้านเดี่ยว"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "คอนโด", icon: Icons.apartment, isSelected: housingType == "คอนโด", onTap: () => setState(() => housingType = "คอนโด"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "หอพัก", icon: Icons.domain, isSelected: housingType == "หอพัก", onTap: () => setState(() => housingType = "หอพัก"))),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildQuestionContainer(
            question: "ขนาดพื้นที่พักอาศัยของคุณเป็นอย่างไร ?",
            subtitle: "เพื่อประเมินความเหมาะสมกับแมวที่ต้องการพื้นที่",
            content: Row(
              children: [
                Expanded(child: _buildImageChoice(label: "กว้างขวาง", icon: Icons.landscape, isSelected: spaceSize == "กว้างขวาง", onTap: () => setState(() => spaceSize = "กว้างขวาง"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "ปานกลาง", icon: Icons.crop_square, isSelected: spaceSize == "ปานกลาง", onTap: () => setState(() => spaceSize = "ปานกลาง"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "คับแคบ", icon: Icons.view_compact, isSelected: spaceSize == "คับแคบ", onTap: () => setState(() => spaceSize = "คับแคบ"))),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildQuestionContainer(
            question: "ปัจจุบันมีสัตว์เลี้ยงอื่นอยู่แล้วหรือไม่ ?",
            subtitle: "ตอบคำถามนี้เพื่อวิเคราะห์ความเหมาะสมในการรับเลี้ยงแมว",
            content: Row(
              children: [
                Expanded(child: _buildImageChoice(label: "มี", icon: Icons.pets, isSelected: hasPets == "มี", onTap: () => setState(() => hasPets = "มี"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "ไม่มี", icon: Icons.not_interested, isSelected: hasPets == "ไม่มี", onTap: () => setState(() => hasPets = "ไม่มี"))),
              ],
            ),
          ),
          const SizedBox(height: 30),
          _buildNextBtn(),
        ],
      ),
    );
  }

  // ==========================================
  // Step 2
  // ==========================================
  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildQuestionContainer(
            question: "คุณมีเวลาว่างให้สัตว์เลี้ยงมากแค่ไหน ?",
            subtitle: "ตอบคำถามนี้เพื่อวิเคราะห์ความเหมาะสมในการรับเลี้ยงแมว",
            content: Row(
              children: [
                Expanded(child: _buildImageChoice(label: "1-2 ชม.", icon: Icons.computer, isSelected: freeTime == "2", onTap: () => setState(() => freeTime = "2"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "3-5 ชม.", icon: Icons.access_time, isSelected: freeTime == "4", onTap: () => setState(() => freeTime = "4"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "> 5 ชม.", icon: Icons.home_work, isSelected: freeTime == "6", onTap: () => setState(() => freeTime = "6"))),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildQuestionContainer(
            question: "คุณมีประสบการณ์การเลี้ยงแมวหรือไม่ ?",
            subtitle: "ตอบคำถามนี้เพื่อวิเคราะห์ความเหมาะสมในการรับเลี้ยงแมว",
            content: Row(
              children: [
                Expanded(child: _buildImageChoice(label: "มือใหม่", icon: Icons.face, isSelected: experience == "มือใหม่", onTap: () => setState(() => experience = "มือใหม่"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "พื้นฐาน", icon: Icons.pets, isSelected: experience == "พื้นฐาน", onTap: () => setState(() => experience = "พื้นฐาน"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "ระดับสูง", icon: Icons.health_and_safety, isSelected: experience == "ระดับสูง", onTap: () => setState(() => experience = "ระดับสูง"))),
              ],
            ),
          ),
          const SizedBox(height: 30),
          Row(
            children: [
              Expanded(child: _buildBackBtn()),
              const SizedBox(width: 16),
              Expanded(child: _buildNextBtn()),
            ],
          )
        ],
      ),
    );
  }

  // ==========================================
  // Step 3
  // ==========================================
  Widget _buildStep3() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildQuestionContainer(
            question: "ในบ้านมีเด็กหรือคนแพ้ขนแมวหรือไม่ ?",
            subtitle: "ตอบคำถามนี้เพื่อวิเคราะห์ความเหมาะสมในการรับเลี้ยงแมว",
            content: Row(
              children: [
                Expanded(child: _buildImageChoice(label: "มี", icon: Icons.child_care, isSelected: hasChildren == "มี", onTap: () => setState(() => hasChildren = "มี"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "ไม่มี", icon: Icons.no_accounts, isSelected: hasChildren == "ไม่มี", onTap: () => setState(() => hasChildren = "ไม่มี"))),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildQuestionContainer(
            question: "คุณมีงบประมาณการเลี้ยงแมวเท่าไหร่ ?",
            subtitle: "ตอบคำถามนี้เพื่อวิเคราะห์ความเหมาะสมในการรับเลี้ยงแมว",
            content: Row(
              children: [
                Expanded(child: _buildImageChoice(label: "< 1,000 ฿", icon: Icons.money_off, isSelected: budget == "1000", onTap: () => setState(() => budget = "1000"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "1k - 3k ฿", icon: Icons.attach_money, isSelected: budget == "3000", onTap: () => setState(() => budget = "3000"))),
                const SizedBox(width: 10),
                Expanded(child: _buildImageChoice(label: "> 3,000 ฿", icon: Icons.monetization_on, isSelected: budget == "5000", onTap: () => setState(() => budget = "5000"))),
              ],
            ),
          ),
          const SizedBox(height: 30),
          Row(
            children: [
              Expanded(child: _buildBackBtn()),
              const SizedBox(width: 16),
              Expanded(child: _buildSaveBtn()),
            ],
          )
        ],
      ),
    );
  }

  // ==========================================
  // UI Helpers
  // ==========================================
  Widget _buildQuestionContainer({required String question, required String subtitle, required Widget content}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.pink[200], // Match image pink container
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Text(
            question, 
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle, 
            style: const TextStyle(fontSize: 12, color: Colors.black87), 
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          content,
        ],
      ),
    );
  }

  Widget _buildImageChoice({required String label, required IconData icon, required bool isSelected, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? Colors.pink[50] : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: isSelected ? Border.all(color: Colors.pink[300]!, width: 2) : Border.all(color: Colors.transparent, width: 2),
        ),
        child: Column(
          children: [
            // Image Placeholder area
            Container(
              height: 100,
              width: double.infinity,
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.vertical(top: Radius.circular(15)),
              ),
              child: Icon(icon, size: 50, color: isSelected ? Colors.pink[500] : Colors.pink[200]),
            ),
            // Button area
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? Colors.pink[400] : const Color(0xFFFFF0F0),
                borderRadius: BorderRadius.circular(30),
                boxShadow: isSelected ? [BoxShadow(color: Colors.pink.withOpacity(0.4), blurRadius: 8, offset: const Offset(0, 3))] : [],
              ),
              child: Center(
                child: Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    color: isSelected ? Colors.white : Colors.black87
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNextBtn() {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30), side: BorderSide(color: Colors.redAccent.withOpacity(0.5))),
        elevation: 0,
      ),
      onPressed: _nextPage,
      child: const Text("ถัดไป", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildBackBtn() {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFFF0F0),
        foregroundColor: Colors.black87,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30), side: const BorderSide(color: Colors.redAccent)),
        elevation: 0,
      ),
      onPressed: _previousPage,
      child: const Text("ย้อนกลับ", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildSaveBtn() {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFFF0F0),
        foregroundColor: Colors.black87,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30), side: const BorderSide(color: Colors.redAccent)),
        elevation: 0,
      ),
      onPressed: _isLoading ? null : _saveProfile,
      child: _isLoading
          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator())
          : const Text("บันทึก", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }
}