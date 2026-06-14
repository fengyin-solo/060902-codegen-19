<template>
  <div class="script-page">
    <div class="script-header" v-if="scripts.length > 0">
      <h2>🎬 关系剧本</h2>
      <p>把高分对话整理成三幕故事：开场、转折与结尾，点击可跳回原短信核对</p>
    </div>

    <div v-if="scripts.length === 0" class="empty-state">
      <div class="icon">🎬</div>
      <h3>还没有剧本</h3>
      <p>先去首页上传短信备份，生成高分对话后即可查看关系剧本</p>
      <router-link to="/" class="btn btn-primary">去上传</router-link>
    </div>

    <div v-else class="scripts-container">
      <div 
        v-for="script in scripts" 
        :key="script.id"
        class="script-book card"
      >
        <div class="book-cover" @click="toggleScript(script.id)">
          <div class="cover-decoration">
            <span class="cover-icon">📖</span>
          </div>
          <h3 class="book-title">{{ script.title }}</h3>
          <p class="book-synopsis">{{ script.synopsis }}</p>
          <div class="book-meta">
            <span class="meta-item">📝 {{ script.totalMessages }} 条短信</span>
            <span class="meta-item">💖 情书指数 {{ script.loveScore }}</span>
          </div>
          <div class="book-tags" v-if="script.tags.length > 0">
            <span 
              v-for="tag in script.tags.slice(0, 5)" 
              :key="tag"
              class="tag"
              :class="getTagClass(tag)"
            >
              {{ tag }}
            </span>
          </div>
          <div class="expand-hint">
            {{ expandedScriptId === script.id ? '收起剧本 ↑' : '展开剧本 ↓' }}
          </div>
        </div>

        <transition name="slide">
          <div v-if="expandedScriptId === script.id" class="book-content">
            <div class="act-timeline">
              <div class="timeline-line"></div>
              <div 
                v-for="(act, actIdx) in script.acts" 
                :key="act.type"
                class="act-section"
                :class="'act-' + act.type"
              >
                <div class="act-marker">
                  <span class="act-icon">{{ act.actIcon }}</span>
                  <span class="act-label">{{ act.label }}</span>
                </div>

                <div class="act-narrative">
                  <p>{{ act.narrative }}</p>
                </div>

                <div class="act-messages">
                  <div 
                    v-for="msg in act.messages" 
                    :key="msg.id"
                    class="script-message"
                    :class="{ sent: msg.isSent, received: msg.isReceived }"
                  >
                    <div class="msg-header">
                      <span class="msg-sender">{{ msg.isSent ? '我' : script.conversationName }}</span>
                      <span class="msg-time">{{ formatDate(msg.date) }}</span>
                    </div>
                    <div class="msg-body">{{ msg.body }}</div>
                    <button 
                      class="verify-btn"
                      @click="verifyMessage(script, msg)"
                      title="跳回原短信核对"
                    >
                      🔗 核对原短信
                    </button>
                  </div>
                </div>

                <div v-if="actIdx < script.acts.length - 1" class="act-connector">
                  <span class="connector-dots">• • •</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="verifyingMsg" class="verify-modal" @click.self="verifyingMsg = null">
      <div class="modal-content card">
        <div class="modal-header">
          <h3>🔗 原短信核对</h3>
          <button class="close-btn" @click="verifyingMsg = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="verify-context">
            <div class="verify-source">
              <span class="verify-label">来自剧本</span>
              <strong>{{ verifyingScriptTitle }}</strong>
            </div>
          </div>

          <div class="verify-message-detail">
            <div class="detail-row">
              <span class="detail-label">发送方</span>
              <span class="detail-value">{{ verifyingMsg.isSent ? '我（发送）' : verifyingMsg.isReceived ? '对方（接收）' : '未知' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">时间</span>
              <span class="detail-value">{{ verifyingMsg.date ? new Date(verifyingMsg.date).toLocaleString('zh-CN') : '未知' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">消息ID</span>
              <span class="detail-value">{{ verifyingMsg.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">在对话中位置</span>
              <span class="detail-value">第 {{ (verifyingMsg.originalIndex || 0) + 1 }} 条</span>
            </div>
          </div>

          <div class="verify-original-msg">
            <div class="original-msg-bubble" :class="{ sent: verifyingMsg.isSent, received: verifyingMsg.isReceived }">
              {{ verifyingMsg.body }}
            </div>
          </div>

          <div class="verify-actions">
            <router-link 
              :to="'/wall'" 
              class="btn btn-primary"
              @click="verifyingMsg = null"
            >
              去情书墙查看完整对话
            </router-link>
            <button class="btn btn-secondary" @click="verifyingMsg = null">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '@/store'
import { generateAllScripts } from '@/detectors/scriptDetector'

const expandedScriptId = ref(null)
const verifyingMsg = ref(null)
const verifyingScriptTitle = ref('')

const scripts = computed(() => {
  if (store.loveLetters.length === 0) return []
  return generateAllScripts(store.loveLetters)
})

function toggleScript(id) {
  expandedScriptId.value = expandedScriptId.value === id ? null : id
}

function verifyMessage(script, msg) {
  verifyingMsg.value = msg
  verifyingScriptTitle.value = script.title
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours().toString().padStart(2, '0')
  const minute = d.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

function getTagClass(tag) {
  if (tag.includes('想念') || tag.includes('思念')) return 'tag-miss'
  if (tag.includes('晚安')) return 'tag-night'
  if (tag.includes('道歉') || tag.includes('对不起')) return 'tag-sorry'
  if (tag.includes('爱意') || tag.includes('双向奔赴')) return 'tag-love'
  if (tag.includes('争吵') || tag.includes('冤家') || tag.includes('情绪')) return 'tag-quarrel'
  if (tag.includes('撒娇') || tag.includes('可爱') || tag.includes('叠字')) return 'tag-cute'
  if (tag.includes('高频') || tag.includes('秒回') || tag.includes('互动')) return 'tag-freq'
  if (tag.includes('剧情') || tag.includes('反转')) return 'tag-script'
  if (tag.includes('情感')) return 'tag-emotion'
  return 'tag'
}
</script>

<style scoped>
.script-page {
  max-width: 900px;
  margin: 0 auto;
}

.script-header {
  text-align: center;
  margin-bottom: 2rem;
}

.script-header h2 {
  font-size: 2rem;
  color: var(--love-red);
  margin-bottom: 0.5rem;
}

.script-header p {
  color: var(--text-light);
}

.scripts-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.script-book {
  overflow: hidden;
  transition: all 0.3s;
}

.script-book:hover {
  box-shadow: 0 8px 30px rgba(231, 76, 60, 0.15);
}

.book-cover {
  cursor: pointer;
  position: relative;
}

.cover-decoration {
  text-align: center;
  margin-bottom: 1rem;
}

.cover-icon {
  font-size: 3rem;
}

.book-title {
  font-size: 1.6rem;
  color: var(--text-dark);
  text-align: center;
  margin-bottom: 0.75rem;
}

.book-synopsis {
  text-align: center;
  color: var(--text-light);
  font-style: italic;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.book-meta {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  font-size: 0.9rem;
  color: var(--text-light);
}

.book-tags {
  text-align: center;
  margin-bottom: 1rem;
}

.expand-hint {
  text-align: center;
  color: var(--love-red);
  font-size: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border);
}

.book-content {
  padding-top: 2rem;
  border-top: 2px solid var(--love-pink);
}

.act-timeline {
  position: relative;
  padding-left: 3rem;
}

.timeline-line {
  position: absolute;
  left: 1rem;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, var(--love-pink), var(--love-red), var(--accent));
  border-radius: 2px;
}

.act-section {
  position: relative;
  margin-bottom: 2rem;
}

.act-section:last-child {
  margin-bottom: 0;
}

.act-marker {
  position: absolute;
  left: -2.5rem;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.act-icon {
  font-size: 1.5rem;
}

.act-label {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--love-red);
  white-space: nowrap;
}

.act-narrative {
  background: linear-gradient(135deg, #fff5f5, #fff0f6);
  border-left: 4px solid var(--love-pink);
  padding: 1rem 1.25rem;
  border-radius: 0 12px 12px 0;
  margin-bottom: 1.25rem;
  font-style: italic;
  color: var(--text-dark);
  line-height: 1.6;
}

.act-opening .act-narrative {
  border-left-color: var(--love-pink);
  background: linear-gradient(135deg, #fff5f5, #fff0f6);
}

.act-turning .act-narrative {
  border-left-color: var(--love-orange);
  background: linear-gradient(135deg, #fff8f0, #fff5e5);
}

.act-ending .act-narrative {
  border-left-color: var(--accent);
  background: linear-gradient(135deg, #f5f0ff, #f0e5ff);
}

.act-messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.script-message {
  position: relative;
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  transition: all 0.2s;
}

.script-message:hover {
  border-color: var(--love-pink);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.1);
}

.script-message.sent {
  border-left: 3px solid var(--love-red);
}

.script-message.received {
  border-left: 3px solid var(--accent);
}

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.msg-sender {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--love-red);
}

.script-message.received .msg-sender {
  color: var(--accent);
}

.msg-time {
  font-size: 0.75rem;
  color: var(--text-light);
}

.msg-body {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}

.verify-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-light);
  border: 1px solid var(--border);
  border-radius: 16px;
  font-size: 0.75rem;
  color: var(--love-red);
  cursor: pointer;
  transition: all 0.2s;
}

.verify-btn:hover {
  background: var(--love-pink);
  color: white;
  border-color: var(--love-pink);
}

.act-connector {
  text-align: center;
  padding: 1rem 0;
}

.connector-dots {
  color: var(--love-pink);
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
}

.verify-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  color: var(--love-red);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-light);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
}

.close-btn:hover {
  background: var(--love-red);
  color: white;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
}

.verify-context {
  margin-bottom: 1.5rem;
}

.verify-source {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-light);
  border-radius: 8px;
}

.verify-label {
  font-size: 0.8rem;
  color: var(--text-light);
  background: white;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.verify-message-detail {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
}

.detail-label {
  color: var(--text-light);
  font-size: 0.9rem;
}

.detail-value {
  color: var(--text-dark);
  font-size: 0.9rem;
}

.verify-original-msg {
  margin-bottom: 1.5rem;
  text-align: center;
}

.original-msg-bubble {
  display: inline-block;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  max-width: 80%;
  font-size: 1.05rem;
  line-height: 1.6;
  background: var(--bg-light);
}

.original-msg-bubble.sent {
  background: linear-gradient(135deg, var(--love-red), var(--love-pink));
  color: white;
  border-bottom-right-radius: 4px;
}

.original-msg-bubble.received {
  background: white;
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.verify-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
  max-height: 5000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
}

.tag-script {
  background: #fff3e0;
  color: #e65100;
}

.tag-emotion {
  background: #fce4ec;
  color: #880e4f;
}
</style>
