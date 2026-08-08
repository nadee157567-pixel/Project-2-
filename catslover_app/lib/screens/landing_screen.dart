import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'login_screen.dart';
import 'signup_screen.dart';
import '../config/api_config.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  List featuredCats = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchFeaturedCats();
  }

  Future<void> fetchFeaturedCats() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.baseUrl + '/cats'));
      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        setState(() {
          // สมมติว่าเอาเฉพาะ 4 ตัวแรกมาแสดงเป็น Featured
          List allCats = responseData['data'] ?? [];
          featuredCats = allCats.take(4).toList();
          isLoading = false;
        });
      } else {
        setState(() { isLoading = false; });
      }
    } catch (error) {
      setState(() { isLoading = false; });
    }
  }

  void _showAuthDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Stack(
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF9EC),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                Container(
                  height: 100,
                  width: 100,
                  decoration: BoxDecoration(
                    color: Colors.pink[100],
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.pets, size: 50, color: Colors.white),
                ),
                const SizedBox(height: 20),
                const Text(
                  "กรุณาเข้าสู่ระบบ",
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                const Text(
                  "เข้าสู่ระบบหรือสมัครสมาชิกเพื่อดูรายละเอียด\nและค้นหาเพื่อนที่ใช่สำหรับคุณ",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, height: 1.5),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const LoginScreen()));
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.pink[400],
                          side: BorderSide(color: Colors.pink[400]!),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                        child: const Text("Sign in", style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const SignupScreen()));
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF8A8A),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                          elevation: 0,
                        ),
                        child: const Text("Sign Up", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
              Positioned(
                right: 12,
                top: 12,
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, size: 20, color: Colors.black54),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink background
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
              // 1. Header (Sign in / Sign up)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const LoginScreen())),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.black87,
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Colors.black12),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          shadowColor: Colors.black12,
                          elevation: 2,
                        ),
                        child: const Text("Sign in", style: TextStyle(fontSize: 16)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SignupScreen())),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF9A9A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          elevation: 0,
                        ),
                        child: const Text("Sign Up", style: TextStyle(fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),

              // 2. Hero Section
              const SizedBox(height: 10),
              const Center(
                child: Text(
                  "CatsLover",
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Image placeholder for stacked cats
              Center(
                child: Image.network(
                  'https://cdn-icons-png.flaticon.com/512/616/616430.png', 
                  height: 120, // ลดขนาดรูปภาพลงเพื่อให้ส่วนอื่นเด่นขึ้น
                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.pets, size: 80, color: Colors.pinkAccent),
                ),
              ),
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  "ค้นหาน้องเหมียวที่ใช่สำหรับคุณด้วยระบบจับคู่ทาสและแมวตามความเหมาะสมและตอบโจทย์ lifestyle",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14, // ปรับข้อความให้ใหญ่และอ่านง่ายขึ้น
                    color: Colors.black87,
                    fontWeight: FontWeight.w600,
                    height: 1.5,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GestureDetector(
                  onTap: _showAuthDialog,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white, // ปรับเป็นสีขาวล้วนให้ช่องค้นหาสว่างขึ้น
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.pink[300]!, width: 1.5), // เพิ่มขอบให้ชัดเจนขึ้น
                      boxShadow: [
                        BoxShadow(
                          color: Colors.pink.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search, color: Colors.grey[800], size: 22),
                        const SizedBox(width: 8),
                        const Text(
                          "ค้นหาแมว/ชื่อแมว",
                          style: TextStyle(fontSize: 16, color: Colors.black87, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 30),

              // 3. How Adoption Works
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    const Text(
                      "ขั้นตอนการรับเลี้ยง",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black54),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Divider(color: Colors.pink[200], thickness: 2)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    _buildStepCard("1", "สร้างบัญชีผู้ใช้", "เข้าร่วมกับเรา", Icons.person_add_alt_1),
                    _buildStepArrow(),
                    _buildStepCard("2", "ทำแบบประเมิน", "บอกไลฟ์สไตล์คุณ", Icons.assignment),
                    _buildStepArrow(),
                    _buildStepCard("3", "ระบบจับคู่", "กับแมวที่ใช่", Icons.favorite),
                    _buildStepArrow(),
                    _buildStepCard("4", "รับเลี้ยงเลย", "เริ่มดูแลเพื่อนใหม่", Icons.home),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // 4. Featured Cats
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  "Featured Cats",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black54),
                ),
              ),
              const SizedBox(height: 12),
              
              SizedBox(
                height: 180,
                child: isLoading
                    ? const Center(child: CircularProgressIndicator(color: Colors.pink))
                    : featuredCats.isEmpty
                        ? const Center(child: Text("ยังไม่มีข้อมูลแมวแนะนำ"))
                        : ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            itemCount: featuredCats.length,
                            itemBuilder: (context, index) {
                              return _buildCatCard(featuredCats[index]);
                            },
                          ),
              ),
              const SizedBox(height: 30),

              // 5. Bottom Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  children: [
                    // Cute cat illustration placeholder
                    Expanded(
                      flex: 4,
                      child: Image.network(
                        'https://cdn-icons-png.flaticon.com/512/2664/2664746.png',
                        height: 120,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.pets, size: 80, color: Colors.grey),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Big Pink Button
                    Expanded(
                      flex: 6,
                      child: ElevatedButton(
                        onPressed: _showAuthDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF9A9A), // Salmon pink
                          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          elevation: 0,
                        ),
                        child: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Column(
                            children: [
                              Text(
                                "พร้อมจะพบเพื่อนใหม่\nของคุณแล้วหรือยัง?",
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                              SizedBox(height: 12),
                              Text(
                                "ค้นหาแมวที่ใช่เลย",
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
      ),
      ),
    );
  }

  Widget _buildStepCard(String number, String title, String subtitle, IconData icon) {
    return Container(
      width: 110,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF9EC), // Light cream
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orange[100],
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: Colors.grey[700], size: 24),
              ),
              Positioned(
                top: -5,
                left: -5,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: Colors.deepOrange,
                    shape: BoxShape.circle,
                  ),
                  child: Text(number, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, height: 1.2),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 8, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildStepArrow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: Colors.orange[300],
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.chevron_right, size: 14, color: Colors.white),
      ),
    );
  }

  Widget _buildCatCard(Map<String, dynamic> cat) {
    return GestureDetector(
      onTap: _showAuthDialog,
      child: Container(
        width: 130,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 5,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                    ),
                    child: cat['image_url'] != null
                        ? ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                            child: Image.network(
                              cat['image_url'],
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Icon(Icons.pets, color: Colors.grey),
                            ),
                          )
                        : const Icon(Icons.pets, color: Colors.grey),
                  ),
                  // Heart icon
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.favorite, color: Colors.redAccent, size: 12),
                    ),
                  ),
                ],
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    cat['pet_name'] ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "${cat['pet_breed'] ?? 'Mixed'} • ${cat['age_months']} mo",
                    style: const TextStyle(fontSize: 9, color: Colors.grey),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
