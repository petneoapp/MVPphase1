import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';

class MyAppointmentsPage extends StatefulWidget {
  const MyAppointmentsPage({super.key});

  @override
  State<MyAppointmentsPage> createState() => _MyAppointmentsPageState();
}

class _MyAppointmentsPageState extends State<MyAppointmentsPage> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _searchController = TextEditingController();
  int _tab = 0;
  bool _isLoading = true;
  String? _errorMessage;
  List<Map<String, dynamic>> _appointments = [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _loadAppointments();
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    setState(() => _query = _searchController.text.trim().toLowerCase());
  }

  Future<void> _loadAppointments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await _apiClient.get(ApiConstants.myAppointments);
      if (!mounted) return;
      if (response['success'] == true) {
        final data = response['data'];
        List<Map<String, dynamic>> list = [];
        if (data is Map && data['appointments'] is List) {
          list = (data['appointments'] as List).whereType<Map<String, dynamic>>().toList();
        } else if (data is List) {
          list = data.whereType<Map<String, dynamic>>().toList();
        }
        setState(() {
          _appointments = list;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response['message']?.toString() ?? 'Failed to load appointments';
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

  List<Map<String, dynamic>> _visibleAppointments() {
    final wantCancelled = _tab == 1;
    final filtered = _appointments.where((a) {
      final status = (a['status'] as String?)?.toLowerCase() ?? '';
      final isCancelled = status == 'cancelled';
      if (wantCancelled != isCancelled) return false;
      if (_query.isEmpty) return true;
      final vet = a['vet'] as Map<String, dynamic>?;
      final pet = a['pet'] as Map<String, dynamic>?;
      final vetName = (vet?['name'] as String? ?? '').toLowerCase();
      final petName = (pet?['name'] as String? ?? '').toLowerCase();
      final reason = (a['reason'] as String? ?? '').toLowerCase();
      return vetName.contains(_query) || petName.contains(_query) || reason.contains(_query);
    }).toList();
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const SizedBox(height: 12),
            const Center(
              child: Text(
                'My Appointments',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search, color: Colors.black54),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'Search for Appointments',
                          hintStyle: TextStyle(color: Colors.grey.shade500),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.primaryPink.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Row(
                  children: [
                    Expanded(child: _tabBtn('My Appointments', 0)),
                    Expanded(child: _tabBtn('Cancelled Appointments', 1)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(child: _buildList()),
          ],
        ),
      ),
    );
  }

  Widget _buildList() {
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
                onPressed: _loadAppointments,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
                child: const Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    final list = _visibleAppointments();
    if (list.isEmpty) {
      return Center(
        child: Text(
          _tab == 0 ? 'No appointments yet' : 'No cancelled appointments',
          style: const TextStyle(color: AppColors.grey),
        ),
      );
    }
    return RefreshIndicator(
      color: AppColors.primaryPink,
      onRefresh: _loadAppointments,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
        itemCount: list.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final appt = list[index];
          final id = appt['appointment_id']?.toString() ?? '';
          return _AppointmentCard(
            appointment: appt,
            onTap: () => context.push('/appointment-details?id=$id'),
          );
        },
      ),
    );
  }

  Widget _tabBtn(String label, int index) {
    final selected = _tab == index;
    return GestureDetector(
      onTap: () => setState(() => _tab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryPink : Colors.transparent,
          borderRadius: BorderRadius.circular(30),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.primaryPink,
            fontWeight: FontWeight.bold,
            fontSize: 11,
          ),
        ),
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback onTap;
  const _AppointmentCard({required this.appointment, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final vet = appointment['vet'] as Map<String, dynamic>?;
    final pet = appointment['pet'] as Map<String, dynamic>?;
    final vetName = vet?['name'] as String? ?? 'Vet';
    final clinicName = vet?['clinic_name'] as String? ?? '';
    final vetProfile = vet?['profile'] as String?;
    final specialization = vet?['specialization'] as String? ?? '';
    final date = appointment['date'] as String? ?? '';
    final time = appointment['time'] as String? ?? '';
    final visitPurpose = appointment['visit_purpose'] as String? ?? 'Visit';
    final status = (appointment['status'] as String? ?? '').toLowerCase();
    final isCancelled = status == 'cancelled';
    final isEmergency = appointment['is_emergency'] == true;

    final petName = pet?['name'] as String? ?? '';
    final petProfile = pet?['profile_picture'] as String?;

    final labelColor = isEmergency
        ? const Color(0xFFFFA0A0)
        : const Color(0xFF8AC59E);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: const Color(0xFFEDEFFB),
                      backgroundImage: (vetProfile != null && vetProfile.isNotEmpty)
                          ? NetworkImage(vetProfile)
                          : const AssetImage('assets/profile.png') as ImageProvider,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dr. $vetName',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          if (clinicName.isNotEmpty) ...[
                            Text(
                              clinicName,
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.grey.shade800),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                          ],
                          Text(
                            specialization.isNotEmpty ? specialization : 'General Veterinarian',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: Colors.blue.shade100),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.calendar_today, size: 13, color: Colors.blue),
                                    const SizedBox(width: 4),
                                    Text(
                                      date,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.access_time, size: 13, color: Colors.blue),
                                    const SizedBox(width: 4),
                                    Text(
                                      time,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: labelColor.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(visitPurpose, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (petName.isNotEmpty) ...[
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: const Color(0xFFEDEFFB),
                        backgroundImage: (petProfile != null && petProfile.isNotEmpty)
                            ? NetworkImage(petProfile)
                            : null,
                        child: (petProfile == null || petProfile.isEmpty)
                            ? const Icon(Icons.pets, size: 12, color: AppColors.primaryPink)
                            : null,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          petName,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                    const Spacer(),
                    SizedBox(
                      height: 34,
                      child: ElevatedButton(
                        onPressed: onTap,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryPink,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        child: const Text('View Details', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (isCancelled)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(16), bottomRight: Radius.circular(8)),
                ),
                child: const Text('Cancelled', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }
}
