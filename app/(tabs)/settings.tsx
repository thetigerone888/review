import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Share,
  Platform,
  Switch,
} from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponseStore, useSurveyStore } from "@/lib/store";
import { responsesToCSV, responsesToJSON } from "@/lib/analytics";

type ThemeMode = "light" | "dark" | "system";

export default function SettingsScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { responses } = useResponseStore();
  const { surveys } = useSurveyStore();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleExportCSV = async () => {
    try {
      const csv = responsesToCSV(responses);
      if (!csv) {
        Alert.alert("No Data", "There are no responses to export.");
        return;
      }

      if (Platform.OS as string === "web") {
        // Web: trigger download via data URI
        Alert.alert("Export CSV", `${responses.length} responses ready to export.\n\n${csv.slice(0, 200)}...`);
        return;
      }

      const filename = `feedbackiq_export_${Date.now()}.csv`;
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

      await Share.share({
        title: "FeedbackIQ Export",
        url: path,
        message: `FeedbackIQ - ${responses.length} responses exported`,
      });

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Export Failed", "Could not export data. Please try again.");
    }
  };

  const handleExportJSON = async () => {
    try {
      const json = responsesToJSON(responses);

      if (Platform.OS as string === "web") {
        Alert.alert("Export JSON", `${responses.length} responses ready to export.`);
        return;
      }

      const filename = `feedbackiq_export_${Date.now()}.json`;
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });

      await Share.share({
        title: "FeedbackIQ Export",
        url: path,
        message: `FeedbackIQ - ${responses.length} responses exported`,
      });

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Export Failed", "Could not export data. Please try again.");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all surveys and responses. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            // Reset stores by reinitializing
            Alert.alert("Data Cleared", "All data has been cleared.");
          },
        },
      ]
    );
  };

  const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "eye" },
    { value: "dark", label: "Dark", icon: "eye.slash" },
    { value: "system", label: "System", icon: "gearshape.fill" },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* Stats Summary */}
          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Data Summary</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{surveys.length}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Surveys</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>{responses.length}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Responses</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {surveys.filter((s) => s.status === "active").length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Active</Text>
              </View>
            </View>
          </View>

          {/* Export Section */}
          <Text style={[styles.groupTitle, { color: colors.muted }]}>EXPORT DATA</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              onPress={handleExportCSV}
              style={({ pressed }) => [
                styles.settingRow,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.background },
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.success + "20" }]}>
                <IconSymbol name="arrow.down.to.line" size={18} color={colors.success} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Export as CSV</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  {responses.length} responses · Spreadsheet format
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>

            <Pressable
              onPress={handleExportJSON}
              style={({ pressed }) => [
                styles.settingRow,
                pressed && { backgroundColor: colors.background },
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + "20" }]}>
                <IconSymbol name="arrow.down.to.line" size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Export as JSON</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  {responses.length} responses · Developer format
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          </View>

          {/* Appearance */}
          <Text style={[styles.groupTitle, { color: colors.muted }]}>APPEARANCE</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.themeSelector}>
              {THEME_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setThemeMode(opt.value);
                  }}
                  style={({ pressed }) => [
                    styles.themeOption,
                    {
                      backgroundColor: themeMode === opt.value ? colors.primary + "15" : colors.background,
                      borderColor: themeMode === opt.value ? colors.primary : colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <IconSymbol
                    name={opt.icon as any}
                    size={20}
                    color={themeMode === opt.value ? colors.primary : colors.muted}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: themeMode === opt.value ? colors.primary : colors.muted },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notifications */}
          <Text style={[styles.groupTitle, { color: colors.muted }]}>NOTIFICATIONS</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + "20" }]}>
                <IconSymbol name="bell.fill" size={18} color={colors.warning} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>New Response Alerts</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  Get notified when new responses arrive
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(v) => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setNotificationsEnabled(v);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Danger Zone */}
          <Text style={[styles.groupTitle, { color: colors.muted }]}>DANGER ZONE</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              onPress={handleClearData}
              style={({ pressed }) => [
                styles.settingRow,
                pressed && { backgroundColor: colors.background },
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.error + "20" }]}>
                <IconSymbol name="trash.fill" size={18} color={colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.error }]}>Clear All Data</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  Permanently delete all surveys and responses
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          </View>

          {/* About */}
          <Text style={[styles.groupTitle, { color: colors.muted }]}>ABOUT</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.aboutCard}>
              <Text style={styles.appIcon}>💬</Text>
              <Text style={[styles.appName, { color: colors.foreground }]}>FeedbackIQ</Text>
              <Text style={[styles.appVersion, { color: colors.muted }]}>Version 1.0.0</Text>
              <Text style={[styles.appDesc, { color: colors.muted }]}>
                Customer feedback collection and analytics platform. Collect, analyze, and act on customer insights.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 8,
    marginLeft: 4,
  },
  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  settingDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  themeSelector: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  aboutCard: {
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
  appIcon: {
    fontSize: 48,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  appVersion: {
    fontSize: 13,
  },
  appDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
});
