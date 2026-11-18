import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../firebase_options.dart';
import '../state/app_state.dart';
import '../ui/admin/notification_bell.dart';
import '../ui/shop/notifications_page.dart';
import 'package:uvsshop_app/i18n.dart';

/// Push мэдэгдэл (Firebase Cloud Messaging). Утасны токеныг нэвтэрсэн худалдан
/// авагч (дэлгүүр хэсэг) болон админ/худалдагчид (админ хэсэг) тус тусад нь
/// бүртгэнэ; гарахад ShopState/AdminState.signOut нь токеныг серверээс хасна.
/// Firebase тохируулаагүй (firebase_options.dart түр орлуулга) бол юу ч хийхгүй.
class PushService {
  PushService._();

  /// Энэ утасны FCM токен (push идэвхгүй бол null).
  static String? token;

  static late AppState _app;
  static late GlobalKey<NavigatorState> _nav;
  static final _local = FlutterLocalNotificationsPlugin();
  static const _channel = AndroidNotificationChannel(
    'default',
    'Мэдэгдэл',
    description: 'Захиалга, хүсэлтийн мэдэгдэл',
    importance: Importance.high,
  );

  /// Сүүлд серверт бүртгүүлсэн эзэн (customer id / user id) — давхар бүртгэхгүй.
  static int? _shopOwner;
  static int? _adminOwner;

  static String get _platform => Platform.isIOS ? 'ios' : 'android';

  static Future<void> init(AppState app, GlobalKey<NavigatorState> nav) async {
    _app = app;
    _nav = nav;
    try {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    } catch (e) {
      debugPrint(tr('Push идэвхгүй: {e}', {'e': e}));
      return;
    }
    try {
      final m = FirebaseMessaging.instance;
      await m.requestPermission();
      // iOS: апп нээлттэй үед ч мэдэгдлийг харуулна.
      await m.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);
      if (Platform.isAndroid) {
        await _local.initialize(
          settings: const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher')),
          onDidReceiveNotificationResponse: (r) => _openPayload(r.payload),
        );
        await _local
            .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
            ?.createNotificationChannel(_channel);
      }

      FirebaseMessaging.onMessage.listen(_onForeground);
      FirebaseMessaging.onMessageOpenedApp.listen((msg) => _open(msg.data));
      // getToken/onTokenRefresh: серверийн FCM HTTP v1 `message.token`-д таарах сонгодог токен.
      // ignore: deprecated_member_use
      m.onTokenRefresh.listen((t) {
        token = t;
        _shopOwner = null;
        _adminOwner = null;
        _sync();
      });
      app.shop.addListener(_sync);
      app.admin.addListener(_sync);

      // ignore: deprecated_member_use
      token = await m.getToken();
      _sync();

      // Хаалттай байсан апп-ыг мэдэгдэл дээр дарж нээсэн.
      final initial = await m.getInitialMessage();
      if (initial != null) unawaited(_open(initial.data));
    } catch (e) {
      debugPrint(tr('Push init алдаа: {e}', {'e': e}));
    }
  }

  /// Нэвтэрсэн хэрэглэгчид токеныг бүртгэнэ (нэвтрэх/гарах бүрт дуудагдана).
  static void _sync() {
    final t = token;
    if (t == null) return;
    final customerId = _app.shop.customer?.id;
    if (customerId != _shopOwner) {
      _shopOwner = customerId;
      if (customerId != null) {
        _app.shop.registerPush(t, _platform).catchError((_) => _shopOwner = null);
      }
    }
    final userId = _app.admin.signedIn ? _app.admin.user?.id : null;
    if (userId != _adminOwner) {
      _adminOwner = userId;
      if (userId != null) {
        _app.admin.registerPush(t, _platform).catchError((_) => _adminOwner = null);
      }
    }
  }

  /// Апп нээлттэй үед: Android өөрөө харуулдаггүй тул local мэдэгдлээр харуулна; badge-ийг шинэчилнэ.
  static void _onForeground(RemoteMessage msg) {
    _app.shop.refreshUnread();
    _app.admin.refreshUnread();
    final n = msg.notification;
    if (n == null || !Platform.isAndroid) return;
    _local.show(
      id: msg.hashCode & 0x7fffffff,
      title: n.title,
      body: n.body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: jsonEncode(msg.data),
    );
  }

  static void _openPayload(String? payload) {
    if (payload == null) return;
    try {
      _open(Map<String, dynamic>.from(jsonDecode(payload) as Map));
    } catch (_) {}
  }

  /// Мэдэгдэл дээр дарахад: тухайн хэсэг (админ / дэлгүүр) руу шилжиж мэдэгдлийн жагсаалтыг нээнэ.
  static Future<void> _open(Map<String, dynamic> data) async {
    await _whenReady();
    final admin = data['scope'] == 'admin';
    if (admin) {
      if (!_app.admin.signedIn) return;
      _app.openAdmin();
    } else {
      _app.openShop();
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _nav.currentState?.push(MaterialPageRoute(
        builder: (_) => admin ? const NotificationsPage() : const ShopNotificationsPage(),
      ));
    });
  }

  /// Апп эхлэлийн ачаалал (AppMode.loading) дуусахыг хүлээнэ.
  static Future<void> _whenReady() async {
    if (_app.mode != AppMode.loading) return;
    final done = Completer<void>();
    void listener() {
      if (_app.mode != AppMode.loading && !done.isCompleted) done.complete();
    }

    _app.addListener(listener);
    await done.future;
    _app.removeListener(listener);
  }
}
