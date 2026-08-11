import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import 'chat_message_screen.dart';

class ChatListScreen extends StatefulWidget {
  final int userId;

  const ChatListScreen({super.key, required this.userId});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  List<dynamic> _chats = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchChats();
  }

  Future<void> _fetchChats() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/chats?userId=${widget.userId}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          if (!mounted) return;
          setState(() {
            _chats = data['data'];
            _isLoading = false;
          });
        }
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
      appBar: AppBar(
        title: const Text('ข้อความ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.pink[300],
        elevation: 0,
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : _chats.isEmpty
              ? const Center(child: Text("ยังไม่มีข้อความสนทนา", style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  itemCount: _chats.length,
                  itemBuilder: (context, index) {
                    final chat = _chats[index];
                    
                    // หาว่าเราคุยกับใคร
                    final isApplicant = chat['applicant_id'] == widget.userId;
                    final String chatPartnerName = isApplicant ? chat['poster_name'] : chat['applicant_name'];
                    final String partnerRole = isApplicant ? "เจ้าของแมว" : "ผู้ขอรับเลี้ยง";
                    
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 2,
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: CircleAvatar(
                          backgroundColor: Colors.pink[100],
                          radius: 25,
                          child: const Icon(Icons.person, color: Colors.white, size: 30),
                        ),
                        title: Text(
                          "แชทเรื่อง: น้อง${chat['pet_name'] ?? 'ไม่ทราบชื่อ'}",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        subtitle: Text(
                          "คุยกับคุณ $chatPartnerName ($partnerRole)",
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        trailing: Icon(Icons.chevron_right, color: Colors.pink[300]),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChatMessageScreen(
                                roomId: chat['room_id'],
                                userId: widget.userId,
                                partnerName: chatPartnerName,
                                applicationStatus: chat['application_status'],
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
