import 'package:flutter/material.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/petneo_header.dart';

class PetViewDetailsPage extends StatefulWidget {
  final String petId;
  const PetViewDetailsPage({super.key, required this.petId});

  @override
  State<PetViewDetailsPage> createState() => _PetViewDetailsPageState();
}

class _PetViewDetailsPageState extends State<PetViewDetailsPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _pet;
  Map<String, dynamic>? _owner;
  List<dynamic> _vaccinations = const [];

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
          _owner = (data?['Owner'] ?? data?['owner']) as Map<String, dynamic>?;
          _vaccinations = (data?['vaccinations'] as List<dynamic>?) ?? const [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response['message']?.toString() ?? 'Failed to load pet';
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
      appBar: const PetneoAppBar(title: 'View Details'),
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

    final pet = _pet ?? const <String, dynamic>{};
    final name = pet['name'] as String? ?? '';
    final species = pet['species'] as String? ?? '';
    final breed = (pet['breeding'] ?? pet['breed'] ?? '') as String;
    final gender = pet['gender'] as String? ?? '';
    final dob = (pet['age'] ?? pet['date_of_birth'] ?? '') as String;
    final weight = pet['weight'];
    final licence = pet['licence'] as String? ?? '';
    final profile = pet['profile_picture'] as String?;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: (profile != null && profile.isNotEmpty)
                  ? Image.network(
                      profile,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Image.asset('assets/profile.png', fit: BoxFit.cover),
                    )
                  : Image.asset('assets/profile.png', fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 16),
          _detailRow('Pet Name', name),
          _detailRow('Species', species),
          _detailRow('Breed', breed),
          _detailRow('Gender', gender),
          _detailRow('Date Of Birth', dob),
          _detailRow('Weight', weight == null ? '' : '$weight kg'),
          _detailRow('Licence', licence),
          if (_owner != null) ...[
            const SizedBox(height: 20),
            const Text('Owner', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            _detailRow('Name', _owner?['name'] as String? ?? ''),
            _detailRow('Address', _owner?['address'] as String? ?? ''),
            _detailRow('Contact', _owner?['contact_number'] as String? ?? ''),
          ],
          if (_vaccinations.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text('Vaccinations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ..._vaccinations.whereType<Map<String, dynamic>>().map((v) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.vaccines, color: AppColors.primaryPink, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(v['vaccination_name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 2),
                            Text(
                              '${v['date_vaccinated'] ?? ''} • ${v['dose_type'] ?? ''}',
                              style: const TextStyle(fontSize: 12, color: AppColors.grey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: AppColors.grey, fontSize: 13)),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? '-' : value,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
