#!/bin/bash
# Master script to integrate unified timeline

echo "🎬 Integrating SST v3.0 Unified Timeline System..."

# Run the creation script
./create-unified-timeline.sh

# Update imports in existing files
echo ""
echo "📝 Next steps to complete integration:"
echo ""
echo "1. In App.jsx, add:"
echo "   import './bootstrap/integrateUnifiedTimeline';"
echo ""
echo "2. Replace ConsciousnessTheater with ConsciousnessTheaterUnified"
echo ""
echo "3. In WebGLBackground.jsx, after material creation add:"
echo "   useEffect(() => {"
echo "     if (materialRef.current && window.initShaderController) {"
echo "       window.initShaderController(() => materialRef.current);"
echo "     }"
echo "   }, [materialRef.current]);"
echo ""
echo "4. Test with timeline tools in console:"
echo "   timelineTools.seek(5000) - Jump to 5s"
echo "   timelineTools.nudge(2) - Forward 2s"
echo "   stageClock.start('velocity') - Jump to stage"
echo ""
echo "✅ Unified timeline system ready!"
