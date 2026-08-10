import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import 'cat_detail_screen.dart';
import 'cat_adopters_list_screen.dart';

class PosterCatsScreen extends StatefulWidget {
  final int userId;
  const PosterCatsScreen({super.key, required this.userId});

  @override
  State<PosterCatsScreen> createState() => _PosterCatsScreenState();
}

class _PosterCatsScreenState extends State<PosterCatsScreen> {
  List<dynamic> _cats = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCats();
  }

  Future<void> _fetchCats() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.baseUrl + '/cats/poster/${widget.userId}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          setState(() {
            _cats = data['data'];
          });
        } else {
          setState(() { _cats = []; });
        }
      }
    } catch (e) {
      print("Error fetching poster cats: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFA0A0),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.pets, color: Colors.white, size: 20),
            SizedBox(width: 8),
            Icon(Icons.pets, color: Colors.white, size: 28),
            SizedBox(width: 8),
            Icon(Icons.pets, color: Colors.white, size: 20),
          ],
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : RefreshIndicator(
              onRefresh: _fetchCats,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const SizedBox(height: 10),
                    const Text(
                      'สัตว์เลี้ยงที่ประกาศหาบ้านของคุณ',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (_cats.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Text(
                          'คุณยังไม่มีประกาศหาบ้านเลย',
                          style: TextStyle(color: Colors.grey, fontSize: 16),
                        ),
                      )
                    else
                      ..._cats.map((cat) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: _buildCatCard(context, cat),
                        );
                      }).toList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCatCard(BuildContext context, Map<String, dynamic> cat) {
    final Map<String, dynamic> catData = Map<String, dynamic>.from(cat);
    catData['poster_id'] = widget.userId;

    String petName = cat['pet_name'] ?? 'ไม่ทราบชื่อ';
    String breed = cat['pet_breed'] ?? '';
    int age = int.tryParse(cat['age_months']?.toString() ?? '') ?? 0;
    String imageUrl = cat['image_url'] ?? 'https://via.placeholder.com/150';
    String status = cat['status'] ?? 'available';

    String displayStatus = status == 'available' ? 'ว่าง' 
                        : status == 'pending' ? 'มีผู้ขอรับเลี้ยง'
                        : 'ได้บ้านแล้ว';
    Color statusColor = status == 'available' ? Colors.green 
                        : status == 'pending' ? Colors.orange
                        : Colors.grey;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.pink.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: Image.network(
              imageUrl,
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  const Icon(Icons.pets, color: Colors.grey, size: 50),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(petName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 4),
                Text("$breed อายุ $age เดือน", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.circle, color: statusColor, size: 16),
                              const SizedBox(width: 8),
                              Text(displayStatus, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: statusColor)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          SizedBox(
                            width: double.infinity,
                            height: 30,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => CatDetailScreen(
                                      userId: widget.userId,
                                      catData: catData,
                                    ),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1B3B5A),
                                padding: EdgeInsets.zero,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(15),
                                ),
                              ),
                              child: const Text('รายละเอียด', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            height: 30,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => CatAdoptersListScreen(
                                      catId: int.tryParse(cat['cat_id'].toString()) ?? 0, 
                                      catName: petName,
                                      isAdopted: status == 'adopted',
                                      posterId: widget.userId,
                                    ),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.pink[400],
                                padding: EdgeInsets.zero,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(15),
                                ),
                              ),
                              child: Text(
                                status != 'adopted' ? "ผู้ขอรับเลี้ยง" : "ผู้รับเลี้ยง",
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
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
}
