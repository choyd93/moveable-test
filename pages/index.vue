<template>
    <div class="editor-container">
        <!-- 상단 버튼 패널 -->
        <div class="button-panel">
            <button @click="setActiveTool('text')">텍스트</button>
            <button @click="setActiveTool('memo')">메모</button>
        </div>

        <!-- 컨테이너 영역 -->
        <div class="container" @mousedown="startDrawing">
            <!-- 동적으로 생성된 요소들 -->
            <div
                v-for="(element, index) in elements"
                :key="index"
                class="moveable-target"
                :style="element.style"
                :ref="el => (moveableTargets[index] = el)"
                contenteditable="true"
            >
                {{ element.content }}
            </div>
            <!-- 임시 드래그 박스 -->
            <div v-if="isDragging" class="drag-box" :style="dragBoxStyle"></div>
        </div>

        <!-- Moveable 컴포넌트 -->
        <Moveable
            v-for="(target, index) in moveableTargets"
            :key="index"
            :target="target"
            :draggable="true"
            :resizable="true"
            :rotatable="true"
            :throttleResize="1"
            :keepRatio="false"
            @drag="onDrag"
            @resize="onResize"
            @rotate="onRotate"
        />
    </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import Moveable from 'vue3-moveable';

const activeTool = ref(''); // 현재 선택된 도구 (텍스트, 메모 등)
const elements = reactive([]); // 컨테이너에 추가된 요소들
const moveableTargets = ref([]); // Moveable.js로 제어할 DOM 요소들
const isDragging = ref(false); // 드래그 상태
const dragBoxStyle = ref({}); // 드래그 박스 스타일

// 도구 선택 함수
const setActiveTool = tool => {
    activeTool.value = tool;
};

// 페이지에서 드래그하여 요소 생성
const startDrawing = event => {
    if (!activeTool.value) return;

    const startX = event.offsetX;
    const startY = event.offsetY;
    isDragging.value = false; // 드래그 상태 초기화

    const newElement = {
        type: activeTool.value,
        content: activeTool.value === 'text' ? '텍스트 입력' : '메모 입력',
        style: {
            position: 'absolute',
            left: `${startX}px`,
            top: `${startY}px`,
            width: '0px',
            height: '0px',
            backgroundColor: activeTool.value === 'memo' ? '#ffff99' : 'transparent', // 노란색 배경색상
            border: '1px solid #000',
            padding: '5px',
            cursor: 'move'
        }
    };

    const onMouseMove = moveEvent => {
        isDragging.value = true;
        const currentX = moveEvent.offsetX;
        const currentY = moveEvent.offsetY;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        // 드래그 박스 스타일 업데이트
        dragBoxStyle.value = {
            position: 'absolute',
            left: `${Math.min(currentX, startX)}px`,
            top: `${Math.min(currentY, startY)}px`,
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: 'rgba(0, 120, 255, 0.3)', // 파란색 반투명 배경
            border: '1px dashed #0078ff' // 파란색 점선 테두리
        };

        newElement.style.width = `${width}px`;
        newElement.style.height = `${height}px`;
    };

    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (isDragging.value) {
            // 요소가 성공적으로 드래그된 경우에만 Moveable 인스턴스 생성
            nextTick(() => {
                moveableTargets.value = moveableTargets.value.filter(el => el !== null);
                elements.push(newElement);
            });
        } else {
            // 드래그되지 않은 요소는 삭제
            elements.pop();
        }

        isDragging.value = false; // 드래그 종료
        activeTool.value = ''; // 도구 초기화
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
};

// Moveable.js 드래그 이벤트 핸들러
const onDrag = e => {
    e.target.style.transform = e.transform;
};

// Moveable.js 리사이즈 이벤트 핸들러
const onResize = e => {
    e.target.style.width = `${e.width}px`;
    e.target.style.height = `${e.height}px`;
    e.target.style.transform = e.drag.transform;
};

// Moveable.js 회전 이벤트 핸들러
const onRotate = e => {
    e.target.style.transform = e.drag.transform;
};
</script>

<style scoped>
.editor-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
}

.button-panel {
    display: flex;
    gap: 5px;
    background-color: #333;
    padding: 10px;
    border-radius: 8px;
    color: #fff;
}

.container {
    width: 500px; /* 컨테이너 너비 */
    height: 500px; /* 컨테이너 높이 */
    border: 1px solid #ccc;
    position: relative;
    overflow: hidden;
}

.moveable-target {
    position: absolute;
    border: 1px solid red;
    cursor: move;
}

.drag-box {
    pointer-events: none; /* 드래그 박스는 이벤트를 받지 않음 */
}
</style>
