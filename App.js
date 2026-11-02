import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'seatsave_reservations';
const COLORS = { available: '#2ecc71', reserved: '#f1c40f', occupied: '#e74c3c', unavailable: '#95a5a6' };
const NAVY = '#0b3a75';
const GOLD = '#fbbf24';

const TABLES = [
  { id: 'T1', wing: 'North Wing', seats: 4, outlet: true, base: 'available' },
  { id: 'T2', wing: 'North Wing', seats: 2, outlet: false, base: 'occupied' },
  { id: 'T3', wing: 'North Wing', seats: 4, outlet: true, base: 'available' },
  { id: 'T4', wing: 'Central Hall', seats: 6, outlet: true, base: 'available' },
  { id: 'T5', wing: 'Central Hall', seats: 6, outlet: false, base: 'unavailable' },
  { id: 'T6', wing: 'Central Hall', seats: 2, outlet: false, base: 'available' },
  { id: 'T7', wing: 'South Wing', seats: 4, outlet: true, base: 'available' },
  { id: 'T8', wing: 'South Wing', seats: 8, outlet: true, base: 'available' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00
const fmt = (h) => `${h}:00`;
const dateOptions = () =>
  [0, 1, 2, 3].map((d) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  });

export default function App() {
  const [screen, setScreen] = useState('login');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [capacity, setCapacity] = useState('any');
  const [outlet, setOutlet] = useState('any');
  const [reservations, setReservations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState(dateOptions()[0]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((d) => d && setReservations(JSON.parse(d)));
  }, []);
  const save = (list) => {
    setReservations(list);
    AsyncStorage.setItem(KEY, JSON.stringify(list));
  };

  const login = () => {
    if (!studentId.trim() || !password.trim()) return Alert.alert('Enter your Student ID and password');
    setScreen('home');
  };

  const filtered = TABLES.filter(
    (t) =>
      (capacity === 'any' || t.seats >= Number(capacity)) &&
      (outlet === 'any' || t.outlet === (outlet === 'yes'))
  );

  const overlaps = (tableId) =>
    reservations.some((r) => r.tableId === tableId && r.date === date && start < r.end && end > r.start);

  const confirm = () => {
    if (!selected) return Alert.alert('Select a table first');
    if (start === null || end === null) return Alert.alert('Select start and end time');
    if (end <= start) return Alert.alert('End time must be after start time');
    if (end - start > 3) return Alert.alert('Maximum duration is 3 hours');
    if (overlaps(selected.id)) return Alert.alert('Table already reserved for that time');
    save([...reservations, { id: Date.now().toString(), tableId: selected.id, date, start, end, studentId }]);
    Alert.alert('Reservation confirmed', `${selected.id} on ${date}, ${fmt(start)} to ${fmt(end)}`);
    setSelected(null); setStart(null); setEnd(null);
    setScreen('home');
  };

  const cancel = (id) => save(reservations.filter((r) => r.id !== id));

  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity style={[s.chip, active && s.chipOn]} onPress={onPress}>
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );

  if (screen === 'login') {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: NAVY, justifyContent: 'center' }]}>
        <Text style={s.tag}>USTP LIBRARY RESERVATIONS</Text>
        <Text style={s.logo}>SeatSave</Text>
        <TextInput style={s.input} placeholder="Student ID" value={studentId} onChangeText={setStudentId} />
        <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity style={s.gold} onPress={login}><Text style={s.goldText}>Log In</Text></TouchableOpacity>
        <Text style={s.foot}>For USTP students only</Text>
      </SafeAreaView>
    );
  }

  if (screen === 'reserve') {
    return (
      <SafeAreaView style={s.container}>
        <ScrollView>
          <Text style={s.h1}>Make a reservation</Text>
          <Text style={s.box}>{selected ? `${selected.id} · ${selected.wing} · ${selected.seats} seats` : 'No table selected yet'}</Text>

          <Text style={s.label}>Date (today up to 3 days ahead)</Text>
          <View style={s.row}>{dateOptions().map((d) => <Chip key={d} label={d.slice(5)} active={date === d} onPress={() => setDate(d)} />)}</View>

          <Text style={s.label}>Start time</Text>
          <View style={s.row}>{HOURS.slice(0, -1).map((h) => <Chip key={h} label={fmt(h)} active={start === h} onPress={() => setStart(h)} />)}</View>

          <Text style={s.label}>End time (max 3 hours)</Text>
          <View style={s.row}>{HOURS.slice(1).map((h) => <Chip key={h} label={fmt(h)} active={end === h} onPress={() => setEnd(h)} />)}</View>

          <TouchableOpacity style={s.primary} onPress={confirm}><Text style={s.primaryText}>Confirm reservation</Text></TouchableOpacity>
          <TouchableOpacity style={s.outline} onPress={() => setScreen('home')}><Text>Cancel</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        <Text style={s.h1}>Your space to focus.</Text>
        <Text style={s.small}>{filtered.filter((t) => t.base === 'available').length} tables available · Open 8:00 AM to 8:00 PM</Text>

        <Text style={s.label}>Seating capacity</Text>
        <View style={s.row}>
          {[['any', 'Any'], ['2', '2+'], ['4', '4+'], ['6', '6+']].map(([v, l]) =>
            <Chip key={v} label={l} active={capacity === v} onPress={() => setCapacity(v)} />)}
        </View>
        <Text style={s.label}>Power outlet access</Text>
        <View style={s.row}>
          {[['any', 'Any'], ['yes', 'With outlet'], ['no', 'No outlet']].map(([v, l]) =>
            <Chip key={v} label={l} active={outlet === v} onPress={() => setOutlet(v)} />)}
        </View>

        <Text style={s.h2}>Library floor plan</Text>
        {['North Wing', 'Central Hall', 'South Wing'].map((wing) => (
          <View key={wing}>
            <Text style={s.wing}>{wing}</Text>
            <View style={s.row}>
              {filtered.filter((t) => t.wing === wing).map((t) => {
                const bookedNow = reservations.some((r) => r.tableId === t.id && r.date === dateOptions()[0]);
                const status = t.base === 'available' && bookedNow ? 'reserved' : t.base;
                return (
                  <TouchableOpacity
                    key={t.id}
                    disabled={status === 'occupied' || status === 'unavailable'}
                    style={[s.table, { backgroundColor: COLORS[status], borderWidth: selected?.id === t.id ? 3 : 0 }]}
                    onPress={() => { setSelected(t); setScreen('reserve'); }}
                  >
                    <Text style={s.tableText}>{t.id}</Text>
                    <Text style={s.tableSub}>{t.seats} seats{t.outlet ? ' ⚡' : ''}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={s.row}>
          {Object.entries(COLORS).map(([k, c]) => (
            <Text key={k} style={{ marginRight: 10, color: c, fontWeight: '600' }}>● {k}</Text>
          ))}
        </View>

        <Text style={s.h2}>My reservations</Text>
        {reservations.length === 0 && <Text style={s.small}>None yet. Tap a green table to reserve.</Text>}
        {reservations.map((r) => (
          <View key={r.id} style={s.res}>
            <Text style={{ flex: 1 }}>{r.tableId} · {r.date} · {fmt(r.start)} to {fmt(r.end)}</Text>
            <TouchableOpacity onPress={() => cancel(r.id)}><Text style={{ color: '#e74c3c', fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: (StatusBar.currentHeight || 30) + 10, backgroundColor: '#f4f6fb' },
  tag: { color: GOLD, textAlign: 'center', fontWeight: '600', marginBottom: 6 },
  logo: { color: '#fff', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  foot: { color: '#cbd5e1', textAlign: 'center', marginTop: 20 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  gold: { backgroundColor: GOLD, padding: 14, borderRadius: 8, alignItems: 'center' },
  goldText: { fontWeight: 'bold', color: NAVY },
  h1: { fontSize: 26, fontWeight: 'bold', color: NAVY, marginBottom: 4 },
  h2: { fontSize: 20, fontWeight: 'bold', color: NAVY, marginTop: 20, marginBottom: 8 },
  wing: { fontWeight: '700', marginTop: 8, color: '#334155' },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600', color: '#334155' },
  small: { color: '#64748b' },
  box: { backgroundColor: '#dbeafe', padding: 12, borderRadius: 8, marginVertical: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#e2e8f0', marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: NAVY },
  chipText: { fontWeight: '600', color: '#334155' },
  table: { width: 90, height: 70, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 8, borderColor: NAVY },
  tableText: { color: '#fff', fontWeight: 'bold' },
  tableSub: { color: '#fff', fontSize: 11 },
  primary: { backgroundColor: NAVY, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#fff', fontWeight: 'bold' },
  outline: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  res: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
});