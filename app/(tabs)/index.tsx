import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const defaultRegion: Region = {
  latitude: 10.8231,
  longitude: 106.6297,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "denied" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const mapRegion = useMemo<Region | null>(() => {
    if (!location) {
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [location]);

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      setStatus("loading");
      setErrorMessage("");

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (permission.status !== "granted") {
          setStatus("denied");
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!isMounted) {
          return;
        }

        setLocation(currentPosition.coords);
        setRegion({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setStatus("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể lấy vị trí hiện tại.",
        );
      }
    };

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocation = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setStatus("denied");
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentPosition.coords);
      setRegion({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể lấy vị trí hiện tại.",
      );
    }
  };

  const openMaps = async () => {
    if (!location) {
      return;
    }

    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}(Vị trí của tôi)`,
      default: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
    });

    if (url) {
      await Linking.openURL(url);
    }
  };

  const mapCard =
    Platform.OS === "web" ? (
      <View
        style={[
          styles.mapFallback,
          {
            backgroundColor: colors.background,
            borderColor: colors.icon + "33",
          },
        ]}
      >
        <ThemedText type="subtitle">Bản đồ trên web</ThemedText>
        <ThemedText>
          Trình duyệt đang dùng chế độ web. Bạn vẫn xem được tọa độ hiện tại và
          mở vị trí này trong ứng dụng bản đồ.
        </ThemedText>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={openMaps}
        >
          <ThemedText style={styles.actionButtonText}>Mở trên Maps</ThemedText>
        </Pressable>
      </View>
    ) : (
      <View style={styles.mapContainer}>
        <MapView
          key={`${region.latitude}-${region.longitude}`}
          style={styles.map}
          initialRegion={mapRegion ?? region}
          showsUserLocation
          showsMyLocationButton
        >
          {location ? (
            <Marker
              coordinate={location}
              title="Vị trí hiện tại"
              description="Đây là vị trí vừa lấy được"
            />
          ) : null}
        </MapView>
      </View>
    );

  return (
    <ThemedView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <ThemedText type="title">Geo demo</ThemedText>
        <ThemedText style={styles.subtitle}>
          Lấy vị trí hiện tại của máy và đánh dấu trực tiếp lên bản đồ.
        </ThemedText>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[styles.statusPill, { backgroundColor: colors.tint + "18" }]}
        >
          <ThemedText style={{ color: colors.tint }}>
            {status === "loading"
              ? "Đang lấy vị trí"
              : status === "ready"
                ? "Đã sẵn sàng"
                : status === "denied"
                  ? "Chưa cấp quyền"
                  : "Có lỗi"}
          </ThemedText>
        </View>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={refreshLocation}
        >
          <ThemedText style={styles.actionButtonText}>Làm mới</ThemedText>
        </Pressable>
      </View>

      {mapCard}

      <View style={[styles.infoCard, { borderColor: colors.icon + "22" }]}>
        <ThemedText type="subtitle">Tọa độ hiện tại</ThemedText>
        <ThemedText>
          {location
            ? `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ${Math.round(location.accuracy ?? 0)} m`
            : "Chưa có dữ liệu vị trí."}
        </ThemedText>
        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}
        {location ? (
          <Pressable
            style={[styles.secondaryButton, { borderColor: colors.tint }]}
            onPress={openMaps}
          >
            <ThemedText style={{ color: colors.tint }}>
              Mở vị trí trong Maps
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  hero: {
    gap: 8,
    paddingTop: 24,
  },
  subtitle: {
    opacity: 0.8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  mapContainer: {
    height: 360,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    minHeight: 240,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    justifyContent: "space-between",
    gap: 16,
  },
  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorText: {
    color: "#B42318",
  },
});
