import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'cat_detail_screen.dart';
import '../config/api_config.dart';

class PosterHistoryScreen extends StatefulWidget {
  final int userId;

  const PosterHistoryScreen({super.key, required this.userId});

  @override
  State<PosterHistoryScreen> createState() => _PosterHistoryScreenState();
}

class _PosterHistoryScreenState extends State<PosterHistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _postedCats = [];

  @override
  void initState() {
    super.initState();
    _fetchPostedCats();
  }

  Future<void> _fetchPostedCats() async {
    setState(() => _isLoading = true);
    try {
      final catRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/cats/poster/${widget.userId}'));
      if (catRes.statusCode == 200) {
        final catData = jsonDecode(catRes.body);
        if (catData['success'] == true && catData['data'] != null) {
          setState(() {
            _postedCats = catData['data'] as List;
          });
        }
      }
    } catch (e) {
      print("Error fetching poster history: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
      appBar: AppBar(
        backgroundColor: Colors.pink[400],
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "ประวัติการโพสต์หาบ้าน",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : _postedCats.isEmpty
              ? const Center(
                  child: Text(
                    "คุณยังไม่มีประวัติการลงประกาศ",
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _postedCats.length,
                  itemBuilder: (context, index) {
                    final Map<String, dynamic> cat = Map<String, dynamic>.from(_postedCats[index]);
                    cat['poster_id'] = widget.userId;

                    String catName = cat['pet_name'] ?? 'ไม่ทราบชื่อ';
                    String imageUrl = cat['image_url'] ?? 'https://via.placeholder.com/150';
                    String breed = cat['pet_breed'] ?? 'ไม่ระบุพันธุ์';
                    String status = cat['status'] ?? 'available';
                    
                    String displayStatus = status == 'available' ? 'กำลังหาบ้าน' : 'ได้บ้านแล้ว';
                    Color statusColor = status == 'available' ? Colors.orange : Colors.green;

                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CatDetailScreen(
                              userId: widget.userId,
                              catData: cat,
                            ),
                          ),
                        ).then((value) => _fetchPostedCats());
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                              child: Image.network(
                                imageUrl,
                                height: 180,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Container(
                                  height: 180,
                                  width: double.infinity,
                                  color: Colors.grey[200],
                                  child: const Icon(Icons.pets, color: Colors.grey, size: 50),
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          catName,
                                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.pinkAccent),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'สายพันธุ์: $breed',
                                          style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: statusColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: statusColor),
                                    ),
                                    child: Text(
                                      displayStatus,
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: statusColor),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
