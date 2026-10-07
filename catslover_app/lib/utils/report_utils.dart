import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../config/api_config.dart';

class ReportUtils {
  static void showReportDialog(
    BuildContext context, {
    required int reporterId,
    int? reportedUserId,
    int? catId,
  }) {
    String selectedReason = 'พฤติกรรมไม่เหมาะสม/คุกคาม';
    final List<String> reasons = [
      'พฤติกรรมไม่เหมาะสม/คุกคาม',
      'ข้อมูลปลอม/สแปม',
      'หลอกลวง/มิจฉาชีพ',
      'รูปภาพไม่เหมาะสม',
      'อื่นๆ'
    ];
    final TextEditingController detailsController = TextEditingController();
    List<File> selectedImages = [];
    final ImagePicker picker = ImagePicker();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext bottomSheetContext) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'รายงานปัญหา',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.red),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('เหตุผลในการรายงาน', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: selectedReason,
                        items: reasons.map((String reason) {
                          return DropdownMenuItem<String>(
                            value: reason,
                            child: Text(reason),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            selectedReason = newValue!;
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('รายละเอียดเพิ่มเติม (ไม่บังคับ)', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  TextField(
                    controller: detailsController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'อธิบายปัญหาที่พบ...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Colors.pink),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('แนบหลักฐาน (ถ้ามี)', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: () async {
                          final List<XFile> images = await picker.pickMultiImage();
                          if (images.isNotEmpty) {
                            setState(() {
                              selectedImages.addAll(images.map((image) => File(image.path)));
                              // จำกัดไม่เกิน 5 รูป
                              if (selectedImages.length > 5) {
                                selectedImages = selectedImages.sublist(0, 5);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('เลือกรูปได้สูงสุด 5 รูป')),
                                );
                              }
                            });
                          }
                        },
                        icon: const Icon(Icons.image, size: 18),
                        label: const Text('เลือกรูปภาพ (สูงสุด 5)'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey[200],
                          foregroundColor: Colors.black87,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (selectedImages.isNotEmpty)
                    SizedBox(
                      height: 80,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: selectedImages.length,
                        itemBuilder: (context, index) {
                          return Stack(
                            children: [
                              Container(
                                margin: const EdgeInsets.only(right: 10),
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  image: DecorationImage(
                                    image: FileImage(selectedImages[index]),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                right: 5,
                                top: 0,
                                child: InkWell(
                                  onTap: () {
                                    setState(() {
                                      selectedImages.removeAt(index);
                                    });
                                  },
                                  child: Container(
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Colors.red,
                                    ),
                                    padding: const EdgeInsets.all(4),
                                    child: const Icon(Icons.close, size: 12, color: Colors.white),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () async {
                        // ปิด bottom sheet
                        Navigator.pop(context);
                        
                        // แสดง loading (optional)
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('กำลังส่งรายงาน...')),
                        );

                        try {
                          // 1. ส่งข้อมูลหลักของรายงานก่อน (ไม่มีรูป)
                          var response = await http.post(
                            Uri.parse('${ApiConfig.baseUrl}/reports'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'reporterId': reporterId.toString(),
                              if (reportedUserId != null) 'reportedUserId': reportedUserId.toString(),
                              if (catId != null) 'catId': catId.toString(),
                              'reason': selectedReason,
                              'details': detailsController.text,
                            }),
                          );

                          if (response.statusCode == 201) {
                            final responseData = jsonDecode(response.body);
                            final reportId = responseData['reportId'];

                            // 2. ถ้ามีรูปภาพ ให้ส่งรูปแยกตามไปที่ API สำหรับรูปภาพ
                            if (selectedImages.isNotEmpty && reportId != null) {
                              var request = http.MultipartRequest(
                                'POST',
                                Uri.parse('${ApiConfig.baseUrl}/reports/$reportId/photos'),
                              );
                              
                              for (var image in selectedImages) {
                                request.files.add(await http.MultipartFile.fromPath(
                                  'evidence_images',
                                  image.path,
                                ));
                              }

                              var streamedResponse = await request.send();
                              var photoResponse = await http.Response.fromStream(streamedResponse);
                              
                              if (photoResponse.statusCode != 201) {
                                throw Exception('Failed to upload photos');
                              }
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('ส่งรายงานสำเร็จ ทีมงานจะรีบตรวจสอบ'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          } else {
                            throw Exception('Failed to create report');
                          }
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('เกิดข้อผิดพลาดในการส่งรายงาน'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      },
                      child: const Text('ส่งรายงาน', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
