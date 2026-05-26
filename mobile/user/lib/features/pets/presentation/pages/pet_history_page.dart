import 'package:flutter/material.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/petneo_header.dart';

class PetHistoryPage extends StatefulWidget {
  final String petId;
  const PetHistoryPage({super.key, required this.petId});

  @override
  State<PetHistoryPage> createState() => _PetHistoryPageState();
}

class _PetHistoryPageState extends State<PetHistoryPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _visitHistory = const [];
  List<dynamic> _prescriptions = const [];
  Map<String, dynamic>? _pet;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    if (widget.petId.isEmpty || widget.petId == 'null') {
      setState(() {
        _errorMessage = 'Pet id missing. Open from My Pets.';
        _isLoading = false;
      });
      return;
    }
    try {
      final response = await _apiClient
          .get(ApiConstants.petById(widget.petId))
          .timeout(const Duration(seconds: 15));
      if (!mounted) return;
      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        setState(() {
          _pet = data?['pet'] as Map<String, dynamic>?;
          _visitHistory = (data?['visit_history'] as List<dynamic>?) ?? const [];
          _prescriptions = (data?['prescriptions'] as List<dynamic>?) ?? const [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response['message']?.toString() ?? 'Failed to load history';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: const PetneoAppBar(title: 'Pet History'),
      body: SafeArea(bottom: false, child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryPink));
    }
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.grey, size: 48),
              const SizedBox(height: 12),
              Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.grey)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _load,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
                child: const Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    final petName = (_pet?['name'] as String?)?.trim() ?? '';
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (petName.isNotEmpty)
            Text(petName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const Text('Visit History', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_visitHistory.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('No visits yet', style: TextStyle(color: AppColors.grey)),
            )
          else
            ..._visitHistory.whereType<Map<String, dynamic>>().map(_buildVisitCard),
          const SizedBox(height: 20),
          const Text('Prescriptions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_prescriptions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('No prescriptions yet', style: TextStyle(color: AppColors.grey)),
            )
          else
            ..._prescriptions.whereType<Map<String, dynamic>>().map(_buildPrescriptionCard),
        ],
      ),
    );
  }

  Widget _buildVisitCard(Map<String, dynamic> v) {
    final date = (v['date'] ?? v['appointment_date'] ?? '') as String;
    final vetName = (v['vet_name'] ?? (v['vet'] is Map ? (v['vet'] as Map)['name'] : '') ?? '') as String;
    final reason = (v['reason'] ?? '') as String;
    final visitType = (v['visit_type'] ?? '') as String;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.event, size: 16, color: AppColors.primaryPink),
              const SizedBox(width: 6),
              Text(date, style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          if (vetName.isNotEmpty) Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text('Vet: $vetName', style: const TextStyle(fontSize: 13)),
          ),
          if (visitType.isNotEmpty) Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text('Visit Type: $visitType', style: const TextStyle(fontSize: 13, color: AppColors.grey)),
          ),
          if (reason.isNotEmpty) Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text('Reason: $reason', style: const TextStyle(fontSize: 13, color: AppColors.grey)),
          ),
        ],
      ),
    );
  }

  Widget _buildPrescriptionCard(Map<String, dynamic> p) {
    final text = (p['text'] ?? '') as String;
    final date = (p['date'] ?? p['created_at'] ?? '') as String;
    final fileUrl = p['file_url'] as String? ?? p['file'] as String?;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.medication_outlined, size: 16, color: AppColors.primaryPink),
              const SizedBox(width: 6),
              if (date.isNotEmpty)
                Text(date, style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          if (text.isNotEmpty) Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(text, style: const TextStyle(fontSize: 13)),
          ),
          if (fileUrl != null && fileUrl.isNotEmpty) Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(fileUrl, style: const TextStyle(fontSize: 11, color: AppColors.primaryPink)),
          ),
        ],
      ),
    );
  }
}
