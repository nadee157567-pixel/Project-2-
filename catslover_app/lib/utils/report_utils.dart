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
    File? selectedImage;
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
                          final XFile? image = await picker.pickImage(source: ImageSource.gallery);
                          if (image != null) {
                            setState(() {
                              selectedImage = File(image.path);
                            });
                          }
                        },
                        icon: const Icon(Icons.image, size: 18),
                        label: const Text('เลือกรูปภาพ'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey[200],
                          foregroundColor: Colors.black87,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      if (selectedImage != null)
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle, color: Colors.green, size: 20),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'แนบรูปภาพแล้ว',
                                  style: TextStyle(color: Colors.green[700], fontSize: 12),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, size: 18, color: Colors.red),
                                onPressed: () {
                                  setState(() {
                                    selectedImage = null;
                                  });
                                },
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                              ),
                            ],
                          ),
                        ),
                    ],
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
                          var request = http.MultipartRequest(
                            'POST',
                            Uri.parse('${ApiConfig.baseUrl}/reports'),
                          );
                          request.fields['reporterId'] = reporterId.toString();
                          if (reportedUserId != null) {
                            request.fields['reportedUserId'] = reportedUserId.toString();
                          }
                          if (catId != null) {
                            request.fields['catId'] = catId.toString();
                          }
                          request.fields['reason'] = selectedReason;
                          request.fields['details'] = detailsController.text;

                          if (selectedImage != null) {
                            request.files.add(await http.MultipartFile.fromPath(
                              'evidence_image',
                              selectedImage!.path,
                            ));
                          }

                          var streamedResponse = await request.send();
                          var response = await http.Response.fromStream(streamedResponse);

                          if (response.statusCode == 201) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('ส่งรายงานสำเร็จ ทีมงานจะรีบตรวจสอบ'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          } else {
                            throw Exception('Failed');
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
