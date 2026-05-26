import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/network/image_helper.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class VetsListPage extends StatefulWidget {
  final String visitType;
  const VetsListPage({super.key, this.visitType = ''});

  @override
  State<VetsListPage> createState() => _VetsListPageState();
}

class _VetsListPageState extends State<VetsListPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _vets = [];

  @override
  void initState() {
    super.initState();
    _loadVets();
  }

  Future<void> _loadVets() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final position = await _resolvePosition();
      if (position == null) {
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          _errorMessage = 'Location unavailable. Enable GPS and permission to see nearby vets.';
        });
        return;
      }

      final now = DateTime.now();
      final targetDate =
          '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

      final response = await _apiClient.get(
        ApiConstants.nearbyVets,
        queryParameters: {
          'user_lat': position['latitude'].toString(),
          'user_lon': position['longitude'].toString(),
          'radius_km': '5',
          'target_date': targetDate,
          'service_ids': '',
          'visit_type': widget.visitType,
        },
      );

      if (!mounted) return;
      if (response['success'] == true) {
        final data = response['data'];
        setState(() {
          _vets = data is List ? data : <dynamic>[];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response['message']?.toString() ?? 'Failed to load vets';
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

  Future<Map<String, double>?> _resolvePosition() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      var permission = await Geolocator.checkPermission();
      
      if (serviceEnabled && permission != LocationPermission.deniedForever) {
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        
        if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
          final pos = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.low,
            timeLimit: const Duration(seconds: 5),
          );
          return {'latitude': pos.latitude, 'longitude': pos.longitude};
        }
      }
    } catch (_) {
      // Ignore GPS errors, fallback to IP
    }

    // IP-based Fallback
    try {
      final response = await http.get(Uri.parse('http://ip-api.com/json')).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'success') {
          return {
            'latitude': (data['lat'] as num).toDouble(),
            'longitude': (data['lon'] as num).toDouble(),
          };
        }
      }
    } catch (_) {
      // Both GPS and IP fallback failed
    }
    
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.black),
          onPressed: () => context.pop(),
        ),
        title: const Text('Vets List', style: TextStyle(color: AppColors.black, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search for near vet or clinic',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: Colors.grey[100],
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildFilterButton(Icons.tune, 'Filter')),
                    const SizedBox(width: 16),
                    Expanded(child: _buildFilterButton(Icons.swap_vert, 'Sort')),
                  ],
                ),
              ],
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Text('Showing ', style: TextStyle(color: AppColors.grey)),
                Text('${_vets.length} Vets', style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primaryPink),
      );
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
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.grey),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadVets,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
                child: const Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }
    if (_vets.isEmpty) {
      return const Center(
        child: Text('No vets nearby', style: TextStyle(color: AppColors.grey)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _vets.length,
      itemBuilder: (context, index) {
        final vet = _vets[index] as Map<String, dynamic>;
        return _buildVetCard(context, vet);
      },
    );
  }

  Widget _buildFilterButton(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildVetCard(BuildContext context, Map<String, dynamic> vet) {
    final vetId = vet['vet_id'];
    final name = vet['name'] as String? ?? 'Vet';
    final experience = vet['experience'];
    final profilePicture = vet['profile_picture'] as String?;
    final availabilityStatus = vet['availability_status'] as String? ?? '';
    final clinic = vet['clinic'] as Map<String, dynamic>?;
    final address = clinic?['address'] as String? ?? '';
    final rating = vet['rating'] as Map<String, dynamic>?;
    final avgRating = (rating?['average'] as num?)?.toDouble() ?? 0.0;
    final ratingCount = rating?['count'] as int? ?? 0;
    final services = (vet['services'] as List<dynamic>?) ?? <dynamic>[];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: const Color(0xFFEDEFFB),
                backgroundImage: (profilePicture != null && profilePicture.isNotEmpty)
                    ? NetworkImage(ImageHelper.getSafeImageUrl(profilePicture) ?? profilePicture)
                    : const AssetImage('assets/profile.png') as ImageProvider,
                onBackgroundImageError: (exception, stackTrace) {}, // prevents crash on invalid URL
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                    if (experience != null)
                      Text(
                        '$experience years Exp',
                        style: const TextStyle(color: AppColors.grey, fontSize: 14),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          avgRating.toStringAsFixed(1),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Flexible(
                          child: Text(
                            ' ($ratingCount Ratings)',
                            style: const TextStyle(color: AppColors.grey, fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (availabilityStatus.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryPink.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    availabilityStatus,
                    style: const TextStyle(color: AppColors.primaryPink, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.location_on, color: AppColors.grey, size: 16),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  address.isNotEmpty ? address : 'Address unavailable',
                  style: const TextStyle(color: AppColors.grey, fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
          if (services.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: services
                  .map((s) {
                    final svc = s as Map<String, dynamic>;
                    return _buildTag(svc['name'] as String? ?? '');
                  })
                  .where((w) => true)
                  .toList(),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                final id = vetId?.toString() ?? '';
                if (id.isEmpty || id == 'null') {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Vet id missing, cannot book')),
                  );
                  return;
                }
                context.push(
                  '/booking?vet_id=$id',
                  extra: {
                    'vet_name': name,
                    'vet_profile': profilePicture,
                    'clinic': clinic,
                    'services': services,
                    'visit_types': vet['visit_types'],
                  },
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryPink,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Book Appointment', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primaryPink.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: const TextStyle(color: AppColors.primaryPink, fontSize: 10)),
    );
  }
}
