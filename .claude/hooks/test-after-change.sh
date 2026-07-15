# hooks/test-after-change.sh — PostToolUse 가 tool_input JSON을 stdin으로 전달함
set -u
CHANGED=$(node -e '
let data = "";
process.stdin.on("data", c => (data += c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data);
    process.stdout.write((input.tool_input && input.tool_input.file_path) || "");
  } catch (e) {}
});
')
[ -n "$CHANGED" ] || exit 0
# 루프 방지: 테스트 파일 자체가 바뀌면 무한 실행을 막기 위해 종료
case "$CHANGED" in
  *.test.js) exit 0 ;;
esac
# 소스 파일 → 테스트 파일 매핑 (services/x.js -> tests/x.test.js)
BASE=$(basename "$CHANGED" .js)
TEST_FILE="tests/${BASE}.test.js"
[ -f "$TEST_FILE" ] || { echo "[hook] 관련 테스트 없음: $TEST_FILE"; exit 0; }
# 관련 테스트만 빠르게 실행 (전체 실행은 커밋 게이트가 담당)
if npx jest "$TEST_FILE" --testPathPattern=tests > /tmp/test-after-change.log 2>&1; then
  echo "[hook] 관련 테스트 통과: $TEST_FILE"
else
  echo "[hook] 관련 테스트 실패 — 결과를 확인하세요:"
  tail -n 30 /tmp/test-after-change.log
fi
exit 0   # 실패를 경고로 알리되 완료를 강제로 막지는 않는다(강제는 Stop 게이트)
